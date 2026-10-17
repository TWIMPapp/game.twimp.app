// Local inventory: items the player has been granted, kept in localStorage per
// trail ref + user (like LocalJournal). Updated as grants arrive:
//   - a batch card's `items` (its on_arrival grants) when that card is shown
//   - `outcome.items` on /next, /awty responses (positive = add, negative = remove)
// Each grant has an id so re-showing a card / re-reading a response never
// applies it twice. The Items tab reads this first and only asks the server
// (/items) when it's empty and the player is past the first card. Reset to
// empty on Start / Start Again.
import QueryParams from '@/typings/QueryParams';
import { InventoryItem } from '@/typings/inventoryItem';

const PREFIX = 'twimp_items_v1:';
const keyFor = (ref?: string, user?: string) => (ref && user ? `${PREFIX}${ref}:${user}` : '');

interface StoredItems {
  items: InventoryItem[];
  applied: string[];
}

const itemId = (it: any) => String(it?.key ?? it?.title ?? it?.name ?? '');

const read = (ref?: string, user?: string): StoredItems | null => {
  const k = keyFor(ref, user);
  if (!k || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object' || !Array.isArray(v.items)) return null;
    return {
      items: v.items.filter((i: any) => i && typeof i === 'object' && itemId(i)),
      applied: Array.isArray(v.applied) ? v.applied.filter((a: any) => typeof a === 'string') : [],
    };
  } catch {
    return null;
  }
};

const write = (ref: string | undefined, user: string | undefined, s: StoredItems) => {
  const k = keyFor(ref, user);
  if (!k) return;
  try { localStorage.setItem(k, JSON.stringify(s)); } catch { /* storage full */ }
};

export const LocalItems = {
  /** Held items, or null when there's no local record yet. */
  read(params?: QueryParams): InventoryItem[] | null {
    return read(params?.trail_ref, params?.user_id)?.items ?? null;
  },

  /** Apply one grant (a list of items with sentiment) once, by grant id. */
  apply(params: QueryParams | undefined, grantId: string, items: any[] | undefined) {
    if (!params?.trail_ref || !params?.user_id || !Array.isArray(items) || !items.length) return;
    const s = read(params.trail_ref, params.user_id) ?? { items: [], applied: [] };
    if (s.applied.includes(grantId)) return;
    for (const it of items) {
      const id = itemId(it);
      if (!id) continue;
      const i = s.items.findIndex(x => itemId(x) === id);
      if (it.sentiment === 'negative') {
        if (i >= 0) s.items.splice(i, 1);
      } else if (i < 0) {
        s.items.push({ ...it, sentiment: it.sentiment ?? 'positive' });
      }
    }
    s.applied.push(grantId);
    write(params.trail_ref, params.user_id, s);
  },

  /** Seed from the server /items list (new device / cleared data mid-game). */
  seed(params: QueryParams | undefined, items: InventoryItem[]) {
    if (!params?.trail_ref || !params?.user_id) return;
    const s = read(params.trail_ref, params.user_id) ?? { items: [], applied: [] };
    write(params.trail_ref, params.user_id, { items: Array.isArray(items) ? items : [], applied: s.applied });
  },

  /** Start / Start Again: empty, authoritative record. */
  reset(ref?: string, user?: string) {
    write(ref, user, { items: [], applied: [] });
  },
};

// ---- Trail meta (items_enabled), from /list, /play, batch /next ----
const META_PREFIX = 'twimp_trail_meta_v1:';

export const TrailMeta = {
  set(ref: string | undefined, meta: { items_enabled?: unknown }) {
    if (!ref || typeof meta?.items_enabled !== 'boolean') return;
    try { localStorage.setItem(META_PREFIX + ref, JSON.stringify({ items_enabled: meta.items_enabled })); } catch { /* ignore */ }
  },
  /** Only an explicit true (as sent by the API) shows Items; unknown = hidden. */
  itemsEnabled(ref?: string): boolean {
    if (!ref || typeof window === 'undefined') return false;
    try {
      const v = JSON.parse(localStorage.getItem(META_PREFIX + ref) || 'null');
      return v?.items_enabled === true;
    } catch {
      return false;
    }
  },
};

/** Called on every /play, /next, /awty response: keeps trail meta and the
 *  local inventory (outcome.items) up to date. */
export function recordGameResponse(path: string, payload: any, result: any) {
  if (!/^(play|next|awty)$/.test(path) || !result || typeof result !== 'object') return;
  const ref = payload?.trail_ref ?? payload?.game_ref;
  const user = payload?.user_id;
  if (!ref || !user) return;
  TrailMeta.set(ref, result);
  const items = result.outcome?.items;
  if (Array.isArray(items) && items.length) {
    const where = result.position ?? result.task?.id ?? 'x';
    const sig = items.map((i: any) => `${i?.sentiment ?? ''}${itemId(i)}`).join(',');
    LocalItems.apply({ trail_ref: ref, user_id: user } as QueryParams, `o:${path}:${where}:${sig}`, items);
  }
}
