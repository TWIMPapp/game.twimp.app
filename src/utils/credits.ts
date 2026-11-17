// Credits shown on the intro screen, minus anything the description already says.
//
// Trails often end their description with "Route and text adapted from …" and
// repeat that sentence at the start of trail_data.credits. We split the credits
// into sentences and drop any sentence that already appears verbatim (ignoring
// case, whitespace and the closing full stop) in the description. Sentences that
// only partly match are kept, so no attribution detail is ever lost. The trail
// text itself is never changed.

const norm = (s: string) =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

const stripEnd = (s: string) => s.replace(/[\s.!?]+$/, '');

/** Split on sentence ends (". " / "! " / "? ") followed by an upper-case letter, digit or quote. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=["'“‘(]?[A-Z0-9])/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function creditsNotInDescription(credits?: string | null, description?: string | null): string | null {
  if (!credits || !credits.trim()) return null;
  const desc = norm(description || '');
  if (!desc) return credits.trim();
  const sentences = splitSentences(credits);
  const kept = sentences.filter(sentence => {
    const key = norm(stripEnd(sentence));
    return key.length === 0 ? false : !desc.includes(key);
  });
  // Nothing repeated: return the credits exactly as written (keeps line breaks).
  if (kept.length === sentences.length) return credits.trim();
  const out = kept.join(' ').trim();
  return out || null;
}
