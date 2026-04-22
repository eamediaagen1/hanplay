#!/usr/bin/env node
/**
 * transform-csv.js
 *
 * Converts hanplayvocab_clean.csv into a production seed dataset for the
 * Supabase `vocabulary` table.
 *
 * Rules:
 *   1. Words that exist in hskData.ts keep their original IDs exactly
 *      (preserves every user's saved_words / SRS history).
 *   2. New words get stable deterministic IDs: hsk{N}-{4-digit-position}
 *      (position = sequential number within the level, zero-padded to 4 digits).
 *   3. Homophones (same hanzi + same level, different pinyin) are both kept;
 *      their IDs are disambiguated by appending the pinyin slug.
 *   4. word_type = lowercased first grammar token (e.g. "Noun/Verb" → "noun")
 *      word_types = all tokens as a lowercase array (e.g. ["noun","verb"])
 *   5. meaning_short = first comma/semicolon clause, max 30 chars.
 *
 * Usage:
 *   node scripts/transform-csv.js [path-to-csv] [output-json]
 *
 *   Defaults:
 *     input  = ../../attached_assets/hanplayvocab_clean_1776774169332.csv
 *     output = scripts/vocabulary_seed.json
 */

const fs = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const CSV_PATH = process.argv[2] ||
  path.join(__dirname, '../../../attached_assets/hanplayvocab_clean_1776774169332.csv');
const OUT_PATH = process.argv[3] ||
  path.join(__dirname, 'vocabulary_seed.json');

// ── Parse CSV ─────────────────────────────────────────────────────────────────

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());
    const row = {};
    header.forEach((h, i) => { row[h.trim()] = cols[i] || ''; });
    return row;
  });
}

// ── Extract existing hskData.ts entries ───────────────────────────────────────

function loadExistingEntries() {
  const srcPath = path.join(__dirname, '../../hsk-trainer/src/data/hskData.ts');
  const src = fs.readFileSync(srcPath, 'utf-8');
  const entries = [];
  // Match single-line object entries
  const re = /id:\s*["']([^"']+)["'],\s*hskLevel:\s*(\d+),\s*category:\s*["']([^"']*)["'],\s*word:\s*["']([^"']+)["'],\s*pinyin:\s*["']([^"']+)["'],\s*meaning:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    entries.push({
      id:       m[1],
      level:    parseInt(m[2]),
      category: m[3],
      word:     m[4],
      pinyin:   m[5],
      meaning:  m[6],
    });
  }
  return entries;
}

// ── Normalise word types ───────────────────────────────────────────────────────

// Map raw CSV category tokens to canonical lowercase grammar types
const TYPE_MAP = {
  'noun':           'noun',
  'verb':           'verb',
  'adjective':      'adjective',
  'adverb':         'adverb',
  'pronoun':        'pronoun',
  'number':         'number',
  'numeral':        'number',
  'classifier':     'classifier',
  'measure word':   'classifier',
  'auxiliary':      'auxiliary',
  'particle':       'auxiliary',
  'conjunction':    'conjunction',
  'preposition':    'preposition',
  'interjection':   'interjection',
  'phrase':         'phrase',
  'suffix':         'suffix',
  'prefix':         'prefix',
  'onomatopoeia':   'interjection',
  'number-classifier': 'classifier',
  'numeral-measure word': 'classifier',
};

function normaliseTypes(raw) {
  const tokens = raw.split('/').map(t => t.trim().toLowerCase());
  const types = tokens.map(t => TYPE_MAP[t] || t).filter(Boolean);
  const unique = [...new Set(types)];
  return {
    word_type:  unique[0] || 'other',
    word_types: unique,
  };
}

// ── meaning_short ─────────────────────────────────────────────────────────────

function meaningShort(meaning) {
  // Take first comma/semicolon/slash clause, cap at 30 chars
  const first = meaning.replace(/^["(]/, '').split(/[,;\/]/)[0].trim();
  return first.length <= 30 ? first : first.slice(0, 27) + '…';
}

// ── Pinyin with tones → ASCII (for homophone disambiguation) ─────────────────

const TONE_MAP = {
  'ā':'a1','á':'a2','ǎ':'a3','à':'a4',
  'ē':'e1','é':'e2','ě':'e3','è':'e4',
  'ī':'i1','í':'i2','ǐ':'i3','ì':'i4',
  'ō':'o1','ó':'o2','ǒ':'o3','ò':'o4',
  'ū':'u1','ú':'u2','ǔ':'u3','ù':'u4',
  'ǖ':'v1','ǘ':'v2','ǚ':'v3','ǜ':'v4','ü':'v',
};

function pinyinSlug(pinyin) {
  let s = pinyin.toLowerCase();
  for (const [accented, ascii] of Object.entries(TONE_MAP)) {
    s = s.split(accented).join(ascii);
  }
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log('Reading CSV from', CSV_PATH);
  const csvRows = parseCSV(CSV_PATH);
  console.log(`CSV rows: ${csvRows.length}`);

  console.log('Loading existing hskData.ts entries…');
  const existing = loadExistingEntries();
  console.log(`Existing hskData entries: ${existing.length}`);

  // Build lookup: word|level → existing ID
  const existingMap = new Map();
  existing.forEach(e => {
    existingMap.set(`${e.word}|${e.level}`, e);
  });

  // Audit counters
  const audit = {
    total: csvRows.length,
    idPreserved: 0,
    idGenerated: 0,
    homophones: 0,
    badRows: 0,
  };

  // Track which existing IDs were matched (to catch stragglers)
  const matchedExistingIds = new Set();

  // Group by level for sequential ID generation
  const byLevel = {};
  for (let lvl = 1; lvl <= 6; lvl++) byLevel[lvl] = [];

  csvRows.forEach(row => {
    const char  = (row.character || '').trim();
    const pin   = (row.pinyin    || '').trim();
    const trans = (row.translation || '').trim();
    const cat   = (row.category  || '').trim();
    const lvl   = parseInt(row.level || '0');

    if (!char || !pin || !trans || lvl < 1 || lvl > 6) {
      audit.badRows++;
      return;
    }

    const { word_type, word_types } = normaliseTypes(cat);

    byLevel[lvl].push({
      _char: char, _pin: pin, _trans: trans, _cat: cat, _lvl: lvl,
      word_type, word_types,
    });
  });

  const output = [];

  for (let lvl = 1; lvl <= 6; lvl++) {
    const rows = byLevel[lvl];

    // Detect homophones at this level (same hanzi, different rows)
    const charCount = {};
    rows.forEach(r => { charCount[r._char] = (charCount[r._char] || 0) + 1; });

    let newSeq = 1; // sequential counter for new IDs within this level
    const usedIds = new Set(); // dedup within this level

    rows.forEach((r, _i) => {
      const existingEntry = existingMap.get(`${r._char}|${lvl}`);
      let id;

      if (existingEntry) {
        id = existingEntry.id;
        matchedExistingIds.add(id);
        usedIds.add(id);
        audit.idPreserved++;
      } else {
        // Generate new stable ID
        const isHomophone = charCount[r._char] > 1;
        if (isHomophone) {
          audit.homophones++;
          const slug = pinyinSlug(r._pin);
          let candidate = `hsk${lvl}-${slug}`;
          // If slug collision (identical tones), add numeric suffix
          let suffix = 2;
          while (usedIds.has(candidate)) {
            candidate = `hsk${lvl}-${slug}-${suffix++}`;
          }
          id = candidate;
        } else {
          id = `hsk${lvl}-${String(newSeq).padStart(4, '0')}`;
          while (usedIds.has(id)) {
            newSeq++;
            id = `hsk${lvl}-${String(newSeq).padStart(4, '0')}`;
          }
        }
        usedIds.add(id);
        newSeq++;
        audit.idGenerated++;
      }

      // Resolve topic_category: only for words carried over from existing app
      const topicCategory = existingEntry ? existingEntry.category : null;

      // Image from existing entry if available
      const imageUrl = '';
      const imageAlt = '';

      output.push({
        id,
        hsk_level:      lvl,
        sort_order:     output.filter(o => o.hsk_level === lvl).length + 1,
        hanzi:          r._char,
        pinyin:         r._pin,
        meaning:        r._trans,
        meaning_short:  meaningShort(r._trans),
        word_type:      r.word_type,
        word_types:     r.word_types,
        topic_category: topicCategory,
        image_url:      imageUrl,
        image_alt:      imageAlt,
        is_active:      true,
      });
    });
  }

  // Any existing entries NOT matched by the new CSV → append as inactive
  existing.forEach(e => {
    if (!matchedExistingIds.has(e.id)) {
      console.warn(`  [warn] Existing entry not found in CSV, appending as inactive: ${e.id} (${e.word})`);
      output.push({
        id:             e.id,
        hsk_level:      e.level,
        sort_order:     99999,
        hanzi:          e.word,
        pinyin:         e.pinyin,
        meaning:        e.meaning,
        meaning_short:  meaningShort(e.meaning),
        word_type:      'other',
        word_types:     ['other'],
        topic_category: e.category,
        image_url:      '',
        image_alt:      '',
        is_active:      false,
      });
    }
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

  console.log('\n── Audit Report ─────────────────────────────────────────────');
  console.log(`Total CSV rows:          ${audit.total}`);
  console.log(`Bad / skipped rows:      ${audit.badRows}`);
  console.log(`IDs preserved (existing):${audit.idPreserved}`);
  console.log(`IDs generated (new):     ${audit.idGenerated}`);
  console.log(`Homophones detected:     ${audit.homophones}`);
  console.log(`Output records:          ${output.length}`);
  const byLvlOut = {};
  output.forEach(o => { byLvlOut[o.hsk_level] = (byLvlOut[o.hsk_level] || 0) + 1; });
  console.log('By level:', JSON.stringify(byLvlOut));
  console.log(`\nSeed file written to:  ${OUT_PATH}`);
}

main();
