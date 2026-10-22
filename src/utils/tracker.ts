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

// ---- GPS smoothing (ported from prototyper /tracker-demo createSmoother) ----
// 1) Outlier gate: reject a fix whose jump from the smoothed point implies more than
//    MAX_SPEED m/s (allowing for both accuracies), unless REJECT_PERSIST rejected fixes
//    in a row agree with each other (within acc+acc+10 m); then restart the window there.
// 2) Smoothed point = 1/acc² weighted mean of accepted fixes (last WIN_N, at most WIN_MS old).
// 3) Light EMA on the distance to the target.
export interface Fix { lat: number; lng: number; acc: number; t: number }
export const TRACKER_SMOOTH = { WIN_N: 3, WIN_MS: 5000, MAX_SPEED: 5, REJECT_PERSIST: 2, EMA_ALPHA: 0.5 };

export function createSmoother(
  dist: (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => number,
  cfg = TRACKER_SMOOTH
) {
  let win: Fix[] = [];
  let pending: Fix[] = [];
  let point: Fix | null = null;
  let emaDist: number | null = null;

  const mean = (fixes: Fix[]): Fix => {
    let W = 0, la = 0, ln = 0;
    for (const f of fixes) { const w = 1 / Math.max(f.acc, 1) ** 2; W += w; la += f.lat * w; ln += f.lng * w; }
    return { lat: la / W, lng: ln / W, acc: Math.sqrt(1 / W), t: fixes[fixes.length - 1].t };
  };

  return {
    add(f: Fix): { accepted: boolean; reason: string } {
      let accepted = true, reason = 'ok';
      if (point) {
        const d = dist(f, point);
        const dt = Math.max((f.t - point.t) / 1000, 0.5);
        const allowed = cfg.MAX_SPEED * dt + f.acc + point.acc;
        if (d > allowed) { accepted = false; reason = 'jump'; }
      }
      if (!accepted) {
        pending.push(f);
        const recent = pending.slice(-cfg.REJECT_PERSIST);
        if (pending.length >= cfg.REJECT_PERSIST && recent.every((q) => dist(q, f) <= q.acc + f.acc + 10)) {
          win = recent; pending = []; accepted = true; reason = 'persisted';
        }
      } else pending = [];
      if (accepted && reason === 'ok') win.push(f);
      win = win.filter((q) => f.t - q.t <= cfg.WIN_MS).slice(-cfg.WIN_N);
      if (win.length) point = mean(win);
      return { accepted, reason };
    },
    smoothDist(target?: { lat: number; lng: number } | null): number | null {
      if (!point || !target) return null;
      const d = dist(point, target);
      emaDist = emaDist == null ? d : emaDist + cfg.EMA_ALPHA * (d - emaDist);
      return emaDist;
    },
    reset() { win = []; pending = []; point = null; emaDist = null; }
  };
}
