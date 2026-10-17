/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { JournalEntry } from '@/services/LocalJournal';

// Journal: entries grouped by stop, oldest first, auto-scrolled to the latest.
// Deliberately styled as a notebook (warm paper background, compact tiles,
// small type) so it can't be mistaken for a full-size game card.

const stepOf = (e: JournalEntry) => (typeof e.position === 'number' ? Math.floor(e.position / 100) : undefined);
const indexInStep = (e: JournalEntry) => (typeof e.position === 'number' ? (e.position % 100) + 1 : undefined);

// First meaningful line of markdown, stripped of markup.
const firstLine = (md: string) => {
  const line = (md || '')
    .split('\n')
    .map(l => l.replace(/[*_#>`~\[\]]/g, '').replace(/\(([^)]*)\)/g, '').trim())
    .find(l => l.length > 0);
  return line || '';
};

const plainText = (md: string) =>
  (md || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[*_#>`~]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

interface Group {
  key: string;
  title: string;
  entries: JournalEntry[];
}

export function groupJournal(entries: JournalEntry[]): Group[] {
  const groups: Group[] = [];
  for (const e of entries) {
    const s = stepOf(e);
    const key = s === undefined ? `x-${e.step_name ?? ''}` : `s-${s}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, title: e.step_name || (s !== undefined ? `Stop ${s + 1}` : 'Earlier'), entries: [] };
      groups.push(g);
    }
    g.entries.push(e);
  }
  return groups;
}

export default function JournalList({ entries, autoScroll = true }: { entries: JournalEntry[]; autoScroll?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll only the journal's own scroll container (the game-page dialog);
    // never the window — the journal is also pre-rendered under the card.
    if (!autoScroll) return;
    let el: HTMLElement | null = endRef.current?.parentElement ?? null;
    while (el) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight;
        return;
      }
      el = el.parentElement;
    }
  }, [autoScroll, entries.length]);

  const groups = groupJournal(entries);

  return (
    <div className="journal-list px-3 pt-3 pb-6" style={{ background: '#f6f1e7', minHeight: 'calc(100vh - 48px)' }} data-testid="journal-list">
      {groups.map(g => (
        <section key={g.key} className="mb-5">
          <h3
            className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
            style={{ color: '#7a6a55' }}
            data-testid="journal-step-heading"
          >
            {g.title}
          </h3>
          <div className="flex flex-col gap-2">
            {g.entries.map((e, i) => {
              const id = `${g.key}-${e.position ?? e.id}`;
              const n = indexInStep(e) ?? i + 1;
              const isOpen = open === id;
              return (
                <div
                  key={id}
                  className="rounded-lg overflow-hidden shadow-sm bg-white"
                  style={{ border: '1px solid #e4dccb' }}
                  data-testid="journal-entry"
                >
                  <button
                    type="button"
                    className="relative block w-full text-left"
                    onClick={() => setOpen(isOpen ? null : id)}
                    aria-expanded={isOpen}
                  >
                    {e.image_url ? (
                      <img
                        src={e.image_url}
                        alt=""
                        loading="lazy"
                        className="block w-full object-cover"
                        style={{ maxHeight: 180, aspectRatio: '16 / 9' }}
                      />
                    ) : (
                      <div className="w-full" style={{ height: 72, background: 'linear-gradient(135deg,#d8cdb8,#bfb197)' }} />
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-3 pb-2 pt-8"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))' }}
                    >
                      <span
                        className="flex-none text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.9)', color: '#3b3226' }}
                      >
                        {n}
                      </span>
                      <span className="text-white text-sm font-medium truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                        {firstLine(e.content)}
                      </span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3 py-2 text-sm whitespace-pre-line" style={{ color: '#3b3226', background: '#fbf8f2' }} data-testid="journal-entry-text">
                      {plainText(e.content)}
                      {e.answer ? <div className="mt-2 font-semibold">Your answer: {e.answer}</div> : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div ref={endRef} />
    </div>
  );
}
