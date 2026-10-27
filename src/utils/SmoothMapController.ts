/**
 * SmoothMapController
 *
 * Decouples raw sensor input (GPS + compass) from map updates by buffering
 * incoming data and applying it to the map on a fixed clock (default 1s).
 * Tuned for a relaxed walking pace (smoothness prioritised over twitchy responsiveness).
 *
 * Architecture:
 *   GPS / compass events  →  accuracy gate + deadband + accuracy-weighted EMA → buffer
 *   1-second tick          →  reads buffer, compares to last-applied state,
 *                             decides whether and how smoothly to animate
 *
 * This means the map can never update faster than the tick interval,
 * regardless of how noisy the sensors are.
 *
 * Portable: no React dependency. Give it an L.Map and call the methods.
 */

import type L from 'leaflet';

// ---- Helpers ---------------------------------------------------------------

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Shortest signed arc between two bearings in degrees (-180..+180). */
function bearingDelta(from: number, to: number): number {
  let d = to - from;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// ---- Types -----------------------------------------------------------------

export interface SmoothMapOptions {
  /** Clock interval in ms. Map updates at most once per tick. Default 1000. */
  tickMs?: number;
  /** Ignore bearing changes smaller than this (degrees). Default 7. */
  minBearingDeltaDeg?: number;
  /** Bearing EMA smoothing factor (0 = frozen, 1 = raw). Default 0.08. */
  bearingEmaAlpha?: number;
  /** Minimum position drift in metres before panning the map. Default 1.2. */
  minPositionDriftM?: number;
  /** Hard ceiling for GPS accuracy in metres once an initial fix is acquired. Default 25. */
  maxGpsAccuracyM?: number;
  /** Number of recent GPS readings used for the rolling average accuracy. Default 10. */
  accuracyWindowSize?: number;
  /** Reject GPS fixes with accuracy > accuracyMultiplier * rollingAverage. Default 2. */
  accuracyMultiplier?: number;
  /** How long (ms) after the user stops interacting before soft-follow recentres & rotates. Default 10000 (10s). */
  softFollowIdleMs?: number;
}

interface BufferedPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

// ---- Controller ------------------------------------------------------------

export class SmoothMapController {
  private map: L.Map;
  private tickMs: number;
  private minBearingDeltaDeg: number;
  private bearingEmaAlpha: number;
  private minPositionDriftM: number;
  private maxGpsAccuracyM: number;
  private accuracyWindowSize: number;
  private accuracyMultiplier: number;
  private softFollowIdleMs: number;

  // Rolling window of recent GPS accuracy readings (last 10 readings, capped at maxGpsAccuracyM)
  private recentAccuracies: number[] = [];

  // Damped/smoothed position and buffered state
  private smoothedPos: { lat: number; lng: number } | null = null;
  private bufferedPos: BufferedPosition | null = null;
  private bufferedBearing: number | null = null;
  private smoothedBearing: number | null = null;

  // Last applied to the map
  private appliedPos: { lat: number; lng: number } | null = null;
  private appliedBearing: number | null = null;

  // State
  private rotationEnabled = false;
  private followMode: 'hard' | 'soft' | 'off' = 'soft';
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private bearingRafId: number | null = null;
  private compassCleanup: (() => void) | null = null;

  // Soft-follow interaction tracking (0 initially so follow & rotation are active until user touches/pans)
  private lastInteractionTime = 0;
  private isInteracting = false;
  private interactionCleanup: (() => void) | null = null;

  constructor(map: L.Map, options: SmoothMapOptions = {}) {
    this.map = map;
    this.tickMs = options.tickMs ?? 1000;
    this.minBearingDeltaDeg = options.minBearingDeltaDeg ?? 7;
    this.bearingEmaAlpha = options.bearingEmaAlpha ?? 0.08;
    this.minPositionDriftM = options.minPositionDriftM ?? 1.2;
    this.maxGpsAccuracyM = options.maxGpsAccuracyM ?? 25;
    this.accuracyWindowSize = options.accuracyWindowSize ?? 10;
    this.accuracyMultiplier = options.accuracyMultiplier ?? 2;
    this.softFollowIdleMs = options.softFollowIdleMs ?? 10000;
  }

  // ---- Public API ----------------------------------------------------------

  /** Start the clock and compass listener. */
  start(): void {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => this.tick(), this.tickMs);
    this.startCompassListener();
    this.startInteractionTracking();
  }

  /** Stop clock and clean up listeners. */
  destroy(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.cancelBearingAnimation();
    this.compassCleanup?.();
    this.compassCleanup = null;
    this.stopInteractionTracking();
  }

  /**
   * Feed a GPS position.
   * 1. Maintains a rolling 10-reading accuracy average (capped at maxGpsAccuracyM = 25m so a 100m spike
   *    cannot blow open the gate).
   * 2. Rejects fixes with accuracy > 2 * rollingAvg or > maxGpsAccuracyM (25m) once an initial fix exists.
   * 3. Applies an error-circle deadband (ignores moves smaller than 0.5 * accuracy when accuracy > 5m)
   *    and walking-pace accuracy-weighted position EMA (posAlpha = clamp(2.5 / accuracy, 0.15, 0.55))
   *    so consecutive fixes glide smoothly and degraded GPS never violently lurches the map.
   */
  updatePosition(lat: number, lng: number, accuracy: number): boolean {
    const safeAccuracy =
      typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0
        ? accuracy
        : 10;

    const isFirstFix = this.bufferedPos === null;
    const avgAccuracy =
      this.recentAccuracies.length === 0
        ? safeAccuracy
        : this.recentAccuracies.reduce((sum, a) => sum + a, 0) / this.recentAccuracies.length;

    // Record reading in the rolling 10-reading window, capped at maxGpsAccuracyM (25m)
    // so an extreme spike cannot blow open the 2x threshold.
    this.recentAccuracies.push(Math.min(safeAccuracy, this.maxGpsAccuracyM));
    if (this.recentAccuracies.length > this.accuracyWindowSize) {
      this.recentAccuracies.shift();
    }

    if (isFirstFix) {
      this.smoothedPos = { lat, lng };
      this.bufferedPos = { lat, lng, accuracy: safeAccuracy, timestamp: Date.now() };
      if (this.appliedPos === null && this.followMode !== 'off') {
        this.map.setView([lat, lng], this.map.getZoom(), { animate: false });
        this.appliedPos = { lat, lng };
      }
      return true;
    }

    const prevAcc = this.bufferedPos?.accuracy ?? Infinity;
    const wasCoarseInitialFix = prevAcc > this.maxGpsAccuracyM;
    const isImprovingCoarseFix = wasCoarseInitialFix && safeAccuracy <= prevAcc;

    // Hard ceiling (25m) + 2x rolling average gate
    if (!isImprovingCoarseFix) {
      if (
        safeAccuracy > this.maxGpsAccuracyM ||
        safeAccuracy > avgAccuracy * this.accuracyMultiplier
      ) {
        return false;
      }
    }

    const prev = this.smoothedPos ?? { lat: this.bufferedPos!.lat, lng: this.bufferedPos!.lng };
    const dist = haversineDistance(prev.lat, prev.lng, lat, lng);

    // Error-circle deadband: if accuracy > 5m and the move is within half the GPS error radius,
    // treat it as stationary GPS jitter and do not move the marker or map.
    if (!wasCoarseInitialFix && safeAccuracy > 5 && dist < safeAccuracy * 0.5) {
      return false;
    }

    // Walking-pace accuracy-weighted EMA: capped at 0.55 for normal GPS fixes so consecutive
    // walking steps blend smoothly instead of stepping rigidly, and damped down to 0.15 as
    // accuracy degrades toward 25m (0 accuracy is reserved for manual test-pin drag).
    const posAlpha =
      wasCoarseInitialFix || safeAccuracy === 0
        ? 1.0
        : Math.max(0.15, Math.min(0.55, 2.5 / Math.max(safeAccuracy, 1)));

    const nextLat = prev.lat + (lat - prev.lat) * posAlpha;
    const nextLng = prev.lng + (lng - prev.lng) * posAlpha;

    this.smoothedPos = { lat: nextLat, lng: nextLng };
    this.bufferedPos = {
      lat: nextLat,
      lng: nextLng,
      accuracy: safeAccuracy,
      timestamp: Date.now()
    };

    return true;
  }

  /** Return the latest accepted & smoothed GPS position (if any). */
  getAcceptedPosition(): { lat: number; lng: number; accuracy: number } | null {
    if (!this.bufferedPos) return null;
    return {
      lat: this.bufferedPos.lat,
      lng: this.bufferedPos.lng,
      accuracy: this.bufferedPos.accuracy
    };
  }

  /** Alias for getAcceptedPosition(). */
  getPosition(): { lat: number; lng: number; accuracy: number } | null {
    return this.getAcceptedPosition();
  }

  /** Return a copy of the rolling accuracy window and its current average. */
  getAccuracyStats(): { recentAccuracies: number[]; average: number } {
    const count = this.recentAccuracies.length;
    const average =
      count === 0 ? 0 : this.recentAccuracies.reduce((sum, a) => sum + a, 0) / count;
    return {
      recentAccuracies: [...this.recentAccuracies],
      average
    };
  }

  /** Immediately centre the map on the given coordinates and re-engage follow & rotation. */
  recenterNow(lat: number, lng: number, zoom?: number): void {
    const prevAcc = this.bufferedPos?.accuracy ?? 10;
    this.smoothedPos = { lat, lng };
    this.bufferedPos = { lat, lng, accuracy: prevAcc, timestamp: Date.now() };
    this.appliedPos = { lat, lng };
    this.isInteracting = false;
    this.lastInteractionTime = 0;
    const targetZoom = zoom ?? this.map.getZoom();
    this.map.setView([lat, lng], targetZoom, {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.25
    } as L.ZoomPanOptions);
    this.tickBearing();
  }

  /** Enable or disable compass-driven rotation. */
  setRotationEnabled(enabled: boolean): void {
    this.rotationEnabled = enabled;
    // If disabling, cancel any in-flight animation and reset the bearing buffer
    // so we don't apply a stale reading when rotation is re-enabled.
    if (!enabled) {
      this.cancelBearingAnimation();
      this.smoothedBearing = null;
      this.bufferedBearing = null;
    }
  }

  /** Set the follow mode: hard (always centre), soft (idle after interaction), off. */
  setFollowMode(mode: 'hard' | 'soft' | 'off'): void {
    this.followMode = mode;
  }

  // ---- Clock tick (the ONLY thing that touches the map) --------------------

  private isUserControlActive(): boolean {
    if (this.followMode !== 'soft') return false;
    if (this.isInteracting) return true;
    return Date.now() - this.lastInteractionTime < this.softFollowIdleMs;
  }

  private cancelBearingAnimation(): void {
    if (this.bearingRafId !== null) {
      cancelAnimationFrame(this.bearingRafId);
      this.bearingRafId = null;
    }
  }

  private tick(): void {
    this.tickPosition();
    this.tickBearing();
  }

  private tickPosition(): void {
    const pos = this.bufferedPos;
    if (!pos) return;

    if (this.followMode === 'hard') {
      const center = this.map.getCenter();
      if (haversineDistance(pos.lat, pos.lng, center.lat, center.lng) > this.minPositionDriftM) {
        this.map.setView([pos.lat, pos.lng], this.map.getZoom(), { animate: false });
        this.appliedPos = { lat: pos.lat, lng: pos.lng };
      }
    } else if (this.followMode === 'soft') {
      // Do not snap back while the user is actively touching/dragging, or
      // within softFollowIdleMs (10s) of their last interaction.
      if (this.isUserControlActive()) return;

      const center = this.map.getCenter();
      const drift = haversineDistance(pos.lat, pos.lng, center.lat, center.lng);
      if (drift > this.minPositionDriftM) {
        this.map.setView([pos.lat, pos.lng], this.map.getZoom(), {
          animate: true,
          duration: 0.9,
          easeLinearity: 0.25
        } as L.ZoomPanOptions);
        this.appliedPos = { lat: pos.lat, lng: pos.lng };
      }
    }
    // followMode === 'off': do nothing
  }

  private tickBearing(): void {
    if (!this.rotationEnabled) return;
    if (this.smoothedBearing == null) return;

    // Pause compass-driven rotation during the 10-second user-controlled window
    if (this.isUserControlActive()) return;

    // Sync appliedBearing with the map's actual current bearing in case the user
    // manually rotated the map (e.g. two-finger touchRotate) while in control.
    // @ts-expect-error — getBearing added by leaflet-rotate
    const currentMapBearing = typeof this.map.getBearing === 'function' ? this.map.getBearing() : null;
    if (typeof currentMapBearing === 'number' && Number.isFinite(currentMapBearing)) {
      this.appliedBearing = ((currentMapBearing % 360) + 360) % 360;
    }

    const target = this.smoothedBearing;

    if (this.appliedBearing == null) {
      // First application — snap immediately
      this.applyBearing(target);
      return;
    }

    const delta = Math.abs(bearingDelta(this.appliedBearing, target));
    if (delta < this.minBearingDeltaDeg) return;

    // Gentle walking-pace rotation: 700ms..950ms across the 1000ms tick
    // so even larger turns glide smoothly instead of whipping around in 200ms.
    const duration = Math.round(700 + (delta / 180) * 250);
    this.animateBearing(target, duration);
  }

  private applyBearing(bearing: number): void {
    // @ts-expect-error — setBearing added by leaflet-rotate
    if (typeof this.map.setBearing === 'function') {
      // @ts-expect-error — setBearing added by leaflet-rotate
      this.map.setBearing(bearing);
    }
    this.appliedBearing = bearing;
  }

  private animateBearing(target: number, durationMs: number): void {
    this.cancelBearingAnimation();
    const start = this.appliedBearing ?? target;
    const delta = bearingDelta(start, target);
    const startTime = performance.now();

    const step = () => {
      if (this.isUserControlActive() || !this.rotationEnabled) {
        this.bearingRafId = null;
        return;
      }
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      // Smooth sine ease-in-out for gentle walking-pace rotation
      const eased = 0.5 * (1 - Math.cos(Math.PI * t));
      const current = ((start + delta * eased) % 360 + 360) % 360;
      this.applyBearing(current);
      if (t < 1) {
        this.bearingRafId = requestAnimationFrame(step);
      } else {
        this.bearingRafId = null;
      }
    };
    this.bearingRafId = requestAnimationFrame(step);
  }

  // ---- Compass listener (internal, buffers only) ---------------------------

  private startCompassListener(): void {
    const handler = (e: DeviceOrientationEvent) => {
      if (!this.rotationEnabled) return;

      const evt = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      const raw: number | null = typeof evt.webkitCompassHeading === 'number'
        ? evt.webkitCompassHeading
        : evt.alpha;
      if (raw == null) return;

      // EMA on circular values
      if (this.smoothedBearing == null) {
        this.smoothedBearing = raw;
        this.bufferedBearing = raw;
        return;
      }

      const delta = bearingDelta(this.smoothedBearing, raw);
      this.smoothedBearing = ((this.smoothedBearing + delta * this.bearingEmaAlpha) % 360 + 360) % 360;
      this.bufferedBearing = this.smoothedBearing;
    };

    // One event type only — both fire on Android, doubling the rate
    const eventType = 'ondeviceorientationabsolute' in window
      ? 'deviceorientationabsolute'
      : 'deviceorientation';

    window.addEventListener(eventType, handler as EventListener);
    this.compassCleanup = () => {
      window.removeEventListener(eventType, handler as EventListener);
    };
  }

  // ---- Interaction tracking for soft-follow --------------------------------

  private startInteractionTracking(): void {
    const onStartOrMove = () => {
      this.isInteracting = true;
      this.lastInteractionTime = Date.now();
      this.cancelBearingAnimation();
    };
    const onEnd = () => {
      if (this.isInteracting) {
        this.isInteracting = false;
        this.lastInteractionTime = Date.now();
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (this.isInteracting || e.buttons > 0) {
        this.lastInteractionTime = Date.now();
        this.cancelBearingAnimation();
      }
    };
    const onWheel = () => {
      this.lastInteractionTime = Date.now();
      this.cancelBearingAnimation();
    };

    this.map.on('dragstart', onStartOrMove);
    this.map.on('drag', onStartOrMove);
    this.map.on('dragend', onEnd);

    const container = this.map.getContainer();
    container.addEventListener('pointerdown', onStartOrMove, { passive: true });
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('touchstart', onStartOrMove, { passive: true });
    container.addEventListener('touchmove', onStartOrMove, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: true });

    window.addEventListener('pointerup', onEnd, { passive: true });
    window.addEventListener('pointercancel', onEnd, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });

    this.interactionCleanup = () => {
      this.map.off('dragstart', onStartOrMove);
      this.map.off('drag', onStartOrMove);
      this.map.off('dragend', onEnd);

      container.removeEventListener('pointerdown', onStartOrMove);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('touchstart', onStartOrMove);
      container.removeEventListener('touchmove', onStartOrMove);
      container.removeEventListener('wheel', onWheel);

      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }

  private stopInteractionTracking(): void {
    this.interactionCleanup?.();
    this.interactionCleanup = null;
  }
}
