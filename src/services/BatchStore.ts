// Batch-next client store.
//
// /next and /awty (sent with batch:true) return the current `task` plus
// `upcoming` — the non-blocking cards after it, ending at the next blocking
// card. We keep that list + an index in localStorage (per trail ref + user)
// so that:
//   - swiping through story cards needs no network round-trip, and
//   - a force-closed / reloaded page can render the right card immediately,
//     even when sessionStorage has been wiped (iOS Safari / home-screen app).
import QueryParams from '@/typings/QueryParams';
import { TaskUnion } from '@/typings/Task';
import { InventoryItem } from '@/typings/inventoryItem';
import { BASE_URL } from '@/constants';
import { recordGameResponse } from '@/services/LocalItems';

export type BatchCard = TaskUnion & {
  position?: number;
  step_name?: string;
  server_call_required?: boolean;
  items?: InventoryItem[];
  synced?: boolean;
};

interface StoredBatch {
  cards: BatchCard[];
  index: number;
  savedAt: number;
}

const PREFIX = 'twimp_batch:';
const META_KEYS = ['position', 'step_name', 'server_call_required', 'items', 'synced'];

const keyFor = (ref?: string, user?: string) => (ref && user ? `${PREFIX}${ref}:${user}` : '');

const read = (ref?: string, user?: string): StoredBatch | null => {
  const k = keyFor(ref, user);
  if (!k || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const b = JSON.parse(raw) as StoredBatch;
    if (!b || !Array.isArray(b.cards) || !b.cards.length) return null;
    if (!Number.isInteger(b.index) || b.index < 0 || b.index >= b.cards.length) return null;
    if (!b.cards.every(c => c && typeof c === 'object' && typeof (c as any).type === 'string')) return null;
    return b;
  } catch {
    return null;
  }
};

const write = (ref: string | undefined, user: string | undefined, b: StoredBatch) => {
  const k = keyFor(ref, user);
  if (!k) return;
  try {
    localStorage.setItem(k, JSON.stringify(b));
  } catch { /* storage full / private mode — batching just degrades to network */ }
};

/** Card with the batch-only fields removed, for comparing with a server copy. */
export const stripBatchMeta = (card: any) => {
  const c = { ...card };
  META_KEYS.forEach(k => delete c[k]);
  return c;
};

const stable = (o: any): string =>
  JSON.stringify(o, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((acc: any, k) => { acc[k] = v[k]; return acc; }, {})
      : v
  );

export const BatchStore = {
  /** Replace the stored batch with a fresh server response (task + upcoming). */
  saveFromResponse(params: QueryParams | undefined, data: any) {
    if (!params || !data?.task) return;
    const first: BatchCard = {
      ...data.task,
      position: data.position,
      step_name: data.step_name,
      server_call_required: false,
      items: [],
      synced: true,
    };
    const upcoming: BatchCard[] = Array.isArray(data.upcoming) ? data.upcoming : [];
    write(params.trail_ref, params.user_id, { cards: [first, ...upcoming], index: 0, savedAt: Date.now() });
  },

  current(params?: QueryParams): BatchCard | null {
    const b = read(params?.trail_ref, params?.user_id);
    return b ? b.cards[b.index] : null;
  },

  /** The next stored card without advancing (for pre-rendering). */
  peek(params?: QueryParams): BatchCard | null {
    const b = read(params?.trail_ref, params?.user_id);
    return b && b.index < b.cards.length - 1 ? b.cards[b.index + 1] : null;
  },

  /** Move to the next stored card, if there is one. Returns it (or null). */
  advance(params?: QueryParams): BatchCard | null {
    const b = read(params?.trail_ref, params?.user_id);
    if (!b || b.index >= b.cards.length - 1) return null;
    b.index += 1;
    write(params?.trail_ref, params?.user_id, b);
    return b.cards[b.index];
  },

  replaceCurrent(params: QueryParams | undefined, card: BatchCard) {
    const b = read(params?.trail_ref, params?.user_id);
    if (!b) return;
    b.cards[b.index] = card;
    write(params?.trail_ref, params?.user_id, b);
  },

  /** Ids of stored cards the player hasn't reached yet (server already sent them). */
  aheadIds(params?: QueryParams): Set<string> {
    const b = read(params?.trail_ref, params?.user_id);
    return new Set(b ? b.cards.slice(b.index + 1).map(c => String((c as any).id)) : []);
  },

  clear(ref?: string, user?: string) {
    const k = keyFor(ref, user);
    if (k) localStorage.removeItem(k);
  },

  sameCard(a: any, b: any) {
    return stable(stripBatchMeta(a)) === stable(stripBatchMeta(b));
  },
};

/** Resolve to undefined if `p` hasn't settled within `ms`. */
export function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>(r => setTimeout(() => r(undefined), ms))]);
}

/** POST helper with a hard timeout so nothing can spin forever. */
export async function postWithTimeout(path: string, body: any, ms = 8000): Promise<any | undefined> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${BASE_URL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    try { recordGameResponse(path, body, data?.body || data); } catch { /* ignore */ }
    return data?.body || data;
  } catch {
    return undefined;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Background cross-check for a card whose source had on_arrival. The server
 * already applied those actions when the batch was sent and advanced the
 * session, so this is a read-only `sync_position` call. Never blocks the UI;
 * if the server's copy differs, `onReplace` gets it.
 */
export function syncCardInBackground(
  params: QueryParams | undefined,
  card: BatchCard | undefined,
  onReplace: (card: BatchCard) => void
) {
  if (!params || !card || !card.server_call_required || card.synced) return;
  if (typeof card.position !== 'number') return;
  postWithTimeout('next', {
    game_ref: params.trail_ref,
    user_id: params.user_id,
    batch: true,
    sync_position: card.position,
  }).then(data => {
    if (!data?.ok || !data.task) {
      console.debug('[TWIMP batch] sync skipped', data?.reason);
      return;
    }
    const merged: BatchCard = { ...data.task, position: card.position, server_call_required: true, items: card.items, synced: true };
    const mismatch = !BatchStore.sameCard(card, data.task);
    BatchStore.replaceCurrent(params, merged);
    if (mismatch) {
      console.debug('[TWIMP batch] server copy differs — swapping', card.position);
      onReplace(merged);
    }
  });
}
