import { supabaseAdmin } from "./supabase.js";
import { logger } from "./logger.js";
import { hskData, type VocabWord } from "../data/hskData.js";

// ── DB row shape ──────────────────────────────────────────────────────────────
// Current table uses the base schema (word/category columns).
// When the full schema upgrade (ALTER TABLE) is applied, add:
//   hanzi, word_type, word_types[], meaning_short, topic_category, search_vector

interface VocabRow {
  id:         string;
  hsk_level:  number;
  word:       string;   // hanzi — renamed after schema upgrade
  pinyin:     string;
  meaning:    string;
  image_url:  string;
  image_alt:  string;
  category:   string | null;  // topic_category or word_type — split after schema upgrade
  sort_order: number;
  is_active:  boolean;
}

// ── Seed row shape (output of transform-csv.cjs) ──────────────────────────────

export interface SeedRow {
  id:             string;
  hsk_level:      number;
  sort_order:     number;
  hanzi:          string;
  pinyin:         string;
  meaning:        string;
  meaning_short:  string | null;
  word_type:      string;
  word_types:     string[];
  topic_category: string | null;
  image_url:      string;
  image_alt:      string;
  is_active:      boolean;
}

// ── DB → API mapping ──────────────────────────────────────────────────────────
// Frontend uses: word.word, word.pinyin, word.meaning, word.imageUrl, word.category
// Zero frontend changes — all mapping happens here.

function dbRowToVocabWord(row: VocabRow): VocabWord {
  return {
    id:       row.id,
    hskLevel: row.hsk_level as 1 | 2 | 3 | 4 | 5 | 6,
    word:     row.word,
    pinyin:   row.pinyin,
    meaning:  row.meaning,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    category: row.category ?? undefined,
  };
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

const cache = {
  byLevel:    new Map<number, VocabWord[]>(),
  allMap:     null as Map<string, VocabWord> | null,
  tableReady: null as boolean | null,
};

export function invalidateVocabularyCache(): void {
  cache.byLevel.clear();
  cache.allMap     = null;
  cache.tableReady = null;
  logger.info("[vocabularyService] cache invalidated");
}

// ─── Table-ready probe ────────────────────────────────────────────────────────

async function isTableReady(): Promise<boolean> {
  if (cache.tableReady !== null) return cache.tableReady;

  const { data, error } = await supabaseAdmin
    .from("vocabulary")
    .select("id")
    .limit(1);

  if (error) {
    logger.warn(
      { code: error.code, msg: error.message },
      "[vocabularyService] vocabulary table not ready — using static fallback"
    );
    cache.tableReady = false;
    return false;
  }

  cache.tableReady = Array.isArray(data) && data.length > 0;
  if (!cache.tableReady) {
    logger.warn(
      "[vocabularyService] vocabulary table empty — using static fallback. " +
      "Run POST /api/admin/seed-vocabulary to populate."
    );
  } else {
    logger.info("[vocabularyService] vocabulary table ready ✓");
  }
  return cache.tableReady;
}

// ─── getVocabByLevel ──────────────────────────────────────────────────────────

const SELECT_FIELDS =
  "id, hsk_level, word, pinyin, meaning, image_url, image_alt, category, sort_order";

const PAGE_SIZE = 1000; // Supabase max-rows default

/**
 * Fetches all active vocabulary rows for a level, handling Supabase's 1000-row
 * max-rows limit by paginating automatically.
 */
async function fetchAllForLevel(level: number): Promise<VocabRow[]> {
  const all: VocabRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("vocabulary")
      .select(SELECT_FIELDS)
      .eq("hsk_level", level)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id",         { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as VocabRow[]));
    if (data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return all;
}

export async function getVocabByLevel(level: number): Promise<VocabWord[]> {
  if (cache.byLevel.has(level)) return cache.byLevel.get(level)!;

  const ready = await isTableReady();
  if (!ready) {
    const words = hskData.filter((w) => w.hskLevel === level);
    cache.byLevel.set(level, words);
    return words;
  }

  try {
    const rows = await fetchAllForLevel(level);
    const words = rows.map(dbRowToVocabWord);
    cache.byLevel.set(level, words);
    return words;
  } catch (err) {
    logger.error({ err, level }, "[vocabularyService] Supabase query failed — falling back to static data");
    return hskData.filter((w) => w.hskLevel === level);
  }
}

// ─── buildAllVocabMap ─────────────────────────────────────────────────────────

export async function buildAllVocabMap(): Promise<Map<string, VocabWord>> {
  if (cache.allMap) return cache.allMap;

  const ready = await isTableReady();
  if (!ready) {
    const map = new Map<string, VocabWord>();
    for (const w of hskData) map.set(w.id, w);
    cache.allMap = map;
    return map;
  }

  // Paginate across all levels to bypass the 1000-row Supabase limit
  try {
    const allRows: VocabRow[] = [];
    for (let lvl = 1; lvl <= 6; lvl++) {
      const rows = await fetchAllForLevel(lvl);
      allRows.push(...rows);
    }
    const map = new Map<string, VocabWord>();
    for (const row of allRows) map.set(row.id, dbRowToVocabWord(row));
    cache.allMap = map;
    logger.info(`[vocabularyService] all-vocab map built: ${map.size} words`);
    return map;
  } catch (err) {
    logger.error({ err }, "[vocabularyService] map build failed — falling back to static data");
    const map = new Map<string, VocabWord>();
    for (const w of hskData) map.set(w.id, w);
    cache.allMap = map;
    return map;
  }
}

// ─── seedVocabularyFromStatic ─────────────────────────────────────────────────
// Legacy seed: upserts the 151-word hskData.ts dataset.
// Use seedVocabularyFromJSON for the full CSV-based seed instead.

const BATCH_SIZE = 500;

export async function seedVocabularyFromStatic(): Promise<{
  total: number; inserted: number; errors: number; batches: number; notes: string[];
}> {
  const notes: string[] = [];
  let inserted = 0, errors = 0;

  const rows = hskData.map((w, i) => ({
    id:         w.id,
    hsk_level:  w.hskLevel,
    sort_order: i,
    word:       w.word,
    pinyin:     w.pinyin,
    meaning:    w.meaning,
    image_url:  w.imageUrl,
    image_alt:  w.imageAlt,
    category:   w.category ?? null,
    is_active:  true,
  }));

  const batches = Math.ceil(rows.length / BATCH_SIZE);
  logger.info(`[vocabularyService] static seed: ${rows.length} words in ${batches} batches`);

  for (let b = 0; b < batches; b++) {
    const slice = rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("vocabulary")
      .upsert(slice, { onConflict: "id", ignoreDuplicates: false });

    if (error) {
      const msg = `Batch ${b + 1}/${batches} failed: ${error.message}`;
      logger.error({ err: error, batch: b + 1 }, `[vocabularyService] ${msg}`);
      notes.push(msg);
      errors += slice.length;
    } else {
      inserted += slice.length;
    }
  }

  invalidateVocabularyCache();
  notes.push(`Seeded ${inserted} of ${rows.length} words (${errors} errors).`);
  return { total: rows.length, inserted, errors, batches, notes };
}

// ─── seedVocabularyFromJSON ───────────────────────────────────────────────────
// Primary seed path: accepts the full 5427-word output of transform-csv.cjs.
// Idempotent — safe to call multiple times (upserts on primary key).

export async function seedVocabularyFromJSON(seedRows: SeedRow[]): Promise<{
  total: number; inserted: number; errors: number; batches: number; notes: string[];
}> {
  const notes: string[] = [];
  let inserted = 0, errors = 0;

  // Map seed rows (new schema with hanzi/word_type/…) → current DB schema (word/category)
  const dbRows = seedRows.map((r) => ({
    id:         r.id,
    hsk_level:  r.hsk_level,
    sort_order: r.sort_order,
    word:       r.hanzi,
    pinyin:     r.pinyin,
    meaning:    r.meaning,
    image_url:  r.image_url,
    image_alt:  r.image_alt,
    category:   r.topic_category ?? r.word_type ?? null,
    is_active:  r.is_active,
  }));

  const batches = Math.ceil(dbRows.length / BATCH_SIZE);
  logger.info(`[vocabularyService] JSON seed: ${dbRows.length} words in ${batches} batches`);

  for (let b = 0; b < batches; b++) {
    const slice = dbRows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("vocabulary")
      .upsert(slice, { onConflict: "id", ignoreDuplicates: false });

    if (error) {
      const msg = `Batch ${b + 1}/${batches} failed: ${error.message}`;
      logger.error({ err: error, batch: b + 1 }, `[vocabularyService] ${msg}`);
      notes.push(msg);
      errors += slice.length;
    } else {
      inserted += slice.length;
      logger.info(`[vocabularyService] batch ${b + 1}/${batches} done (${slice.length} rows)`);
    }
  }

  invalidateVocabularyCache();
  notes.push(`Seeded ${inserted} of ${seedRows.length} words (${errors} errors, ${batches} batches).`);
  logger.info(`[vocabularyService] JSON seed complete — ${inserted}/${seedRows.length} words`);
  return { total: seedRows.length, inserted, errors, batches, notes };
}
