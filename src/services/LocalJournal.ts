// Local journal: what the player has actually seen, kept in localStorage per
// trail ref + user. Appended as each card is shown; deduped by position (or id
// for server-seeded entries). Cleared on Start / Start Again.
import QueryParams from '@/typings/QueryParams';

export interface JournalEntry {
  id: string | number;
  position?: number;
  type: string;
  title?: string;
  content: string;
  image_url?: string;
  answer?: string;
}

const PREFIX = 'twimp_journal:';
const keyFor = (ref?: string, user?: string) => (ref && user ? `${PREFIX}${ref}:${user}` : '');
// Map / finish cards are navigation and reward, not evidence (same as /journal).
const JOURNAL_TYPES = new Set(['information', 'question_single', 'question_multiple']);

const sameEntry = (a: JournalEntry, b: { id?: any; position?: number }) =>
  typeof a.position === 'number' && typeof b.position === 'number'
    ? a.position === b.position
    : String(a.id) === String(b.id);

export const LocalJournal = {
  read(params?: QueryParams): JournalEntry[] {
    const k = keyFor(params?.trail_ref, params?.user_id);
    if (!k || typeof window === 'undefined') return [];
    try {
      const v = JSON.parse(localStorage.getItem(k) || '[]');
      return Array.isArray(v) ? v.filter(e => e && typeof e === 'object' && typeof e.type === 'string') : [];
    } catch {
      return [];
    }
  },

  write(params: QueryParams | undefined, entries: JournalEntry[]) {
    const k = keyFor(params?.trail_ref, params?.user_id);
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(entries)); } catch { /* storage full */ }
  },

  /** Record a card the player is now looking at. */
  add(params: QueryParams | undefined, card: any) {
    if (!params || !card || !JOURNAL_TYPES.has(card.type)) return;
    const entries = LocalJournal.read(params);
    const entry: JournalEntry = {
      id: card.id,
      position: typeof card.position === 'number' ? card.position : undefined,
      type: card.type,
      title: card.title,
      content: typeof card.content === 'string' ? card.content : '',
      image_url: card.image_url,
    };
    const i = entries.findIndex(e => sameEntry(e, entry));
    if (i >= 0) entries[i] = { ...entry, answer: entries[i].answer };
    else entries.push(entry);
    LocalJournal.write(params, entries);
  },

  setAnswer(params: QueryParams | undefined, card: any, answer: string) {
    if (!params || !card) return;
    const entries = LocalJournal.read(params);
    const e = entries.find(x => sameEntry(x, { id: card.id, position: card.position }));
    if (!e) return;
    e.answer = answer;
    LocalJournal.write(params, entries);
  },

  clear(ref?: string, user?: string) {
    const k = keyFor(ref, user);
    if (k) localStorage.removeItem(k);
  },
};
