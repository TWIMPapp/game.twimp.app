// Stale-while-revalidate cache for the home screen's /list response.
// Stored per user, with the location near-you was computed for. Images are
// left to the normal browser cache. Always revalidated by the caller.
const KEY = 'twimp_list_cache_v1';
const MAX_BYTES = 500 * 1024;

export interface ListCacheEntry {
  userId: string;
  lat?: number;
  lng?: number;
  savedAt: number;
  data: any;
}

export function readListCache(userId: string): ListCacheEntry | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const e = JSON.parse(raw);
    if (!e || typeof e !== 'object' || e.userId !== userId || !e.data || typeof e.data !== 'object') return null;
    return e as ListCacheEntry;
  } catch {
    return null;
  }
}

/** Returns true if the stored payload changed. */
export function writeListCache(userId: string, data: any, lat?: number, lng?: number): boolean {
  try {
    const prev = readListCache(userId);
    const json = JSON.stringify({ userId, lat, lng, savedAt: Date.now(), data });
    if (json.length > MAX_BYTES) {
      localStorage.removeItem(KEY);
      return true;
    }
    localStorage.setItem(KEY, json);
    // Remember each game's items_enabled for the game page.
    try {
      for (const k of Object.keys(data || {})) if (Array.isArray(data[k])) data[k].forEach((g: any) => g?.ref && typeof g.items_enabled === 'boolean' && localStorage.setItem('twimp_trail_meta_v1:' + g.ref, JSON.stringify({ items_enabled: g.items_enabled })));
    } catch { /* ignore */ }
    return !prev || JSON.stringify(prev.data) !== JSON.stringify(data);
  } catch {
    return true;
  }
}

/** Drop the cache (e.g. after leaving/finishing a game, so the next home
 *  render can't show a stale Continue/Play again state). */
export function clearListCache() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Metres between two points (haversine). */
export function distanceM(a: { lat?: number; lng?: number }, b: { lat?: number; lng?: number }): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Patch one game in every cached list (e.g. hasSession=true on Start), so a
 *  quick return to home → intro shows Continue even before revalidation. */
export function patchCachedGame(userId: string, ref: string, patch: Record<string, any>) {
  const e = readListCache(userId);
  if (!e) return;
  try {
    for (const k of Object.keys(e.data)) {
      if (Array.isArray(e.data[k])) e.data[k] = e.data[k].map((g: any) => (g?.ref === ref ? { ...g, ...patch } : g));
    }
    localStorage.setItem(KEY, JSON.stringify(e));
  } catch { /* ignore */ }
}
