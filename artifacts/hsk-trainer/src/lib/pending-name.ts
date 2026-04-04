const PENDING_NAME_KEY = "hsk_pending_name";

export function savePendingName(name: string) {
  try { localStorage.setItem(PENDING_NAME_KEY, name.trim()); } catch { /* ignore */ }
}

export function consumePendingName(): string | null {
  try {
    const n = localStorage.getItem(PENDING_NAME_KEY);
    localStorage.removeItem(PENDING_NAME_KEY);
    return n || null;
  } catch {
    return null;
  }
}
