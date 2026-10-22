// Pure logic for the `tracker` task (full-screen distance meter).
// Mirrored in the prototyper preview (prototyper/public/tracker.js) — keep in sync.

export interface TrackerMessage { within: number; message: string }
export interface TrackerColors { background?: string; signal?: string; text?: string }

// Defaults sampled from Monsters in Wimborne safety_guidelines.png:
// dominant dark purple background, slime-green drip highlight, pale lavender text.
export const TRACKER_DEFAULT_COLORS: Required<TrackerColors> = {
  background: '#1d0e2b',
  signal: '#b3dc28',
  text: '#ece4f2'
};
export const TRACKER_DEFAULT_RANGE_M = 80;

/** 0 (at/after max range) … 1 (at target). */
export function trackerSignal(distanceM: number, maxRangeM: number): number {
  if (!isFinite(distanceM) || maxRangeM <= 0) return 0;
  if (distanceM >= maxRangeM) return 0;
  return Math.max(0, Math.min(1, 1 - distanceM / maxRangeM));
}

/** Message for the smallest matching `within`; out_of_range_message when none matches. */
export function trackerMessage(distanceM: number, messages: TrackerMessage[] = [], outOfRange?: string): string {
  const hits = (messages || [])
    .filter((m) => m && typeof m.within === 'number' && distanceM <= m.within)
    .sort((a, b) => a.within - b.within);
  return hits.length ? hits[0].message : outOfRange || '';
}

/** Beep cadence: null = silent. Interval shortens and pitch rises slightly as signal grows. */
export function trackerBeep(signal: number): { intervalMs: number; freqHz: number; rate: number } | null {
  if (signal <= 0) return null;
  return {
    intervalMs: Math.round(1600 - 1450 * signal), // 1.6s faint → 0.15s at target
    freqHz: Math.round(660 + 340 * signal),       // 660Hz → 1000Hz
    rate: 1 + 0.35 * signal                        // playbackRate for beep_url
  };
}

/** Number of lit rings out of `rings`. */
export function trackerLitRings(signal: number, rings = 5): number {
  return signal <= 0 ? 0 : Math.max(1, Math.ceil(signal * rings));
}
