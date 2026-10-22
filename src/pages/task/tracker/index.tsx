// Full-screen distance tracker. Replaces a step's map card. It never completes
// anything itself: it keeps pinging /awty with the player's GPS exactly like the
// map page, so the target step's normal proximity trigger moves the game on.
// Distance only (no compass); metres are never shown.
import { useEffect, useRef, useState } from 'react';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import { Outcome, TaskUnion, TrackerTask } from '@/typings/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import { syncTaskPageWithServer } from '@/services/ServerSync';
import QueryParams from '@/typings/QueryParams';
import ItemsDialog from '@/components/ItemsDialog';
import { InventoryItem } from '@/typings/inventoryItem';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getDistanceInMeters } from '@/utils/geo';
import {
  TRACKER_DEFAULT_COLORS, TRACKER_DEFAULT_RANGE_M,
  trackerBeep, trackerLitRings, trackerMessage, trackerSignal
} from '@/utils/tracker';

const AWTY_INTERVAL = 5000;
const RINGS = 5;

interface AwtyResponse { ok: boolean; message?: string; task?: TaskUnion; outcome?: Outcome }

const detectTestMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return true;
  return new URLSearchParams(window.location.search).get('testMode') === '1';
};

export default function Tracker({ testTask }: { testTask?: TrackerTask }) {
  const [task, setTask] = useState<TrackerTask>();
  const [params, setParams] = useState<QueryParams>();
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [isTestMode] = useState<boolean>(detectTestMode);
  const [testDistance, setTestDistance] = useState<number | null>(null);
  const { position, error } = useGeolocation();

  const awtyPending = useRef(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const beepEl = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  useEffect(() => {
    if (testTask) { setTask(testTask); return; }
    const p = Object.fromEntries(new URLSearchParams(window.location.search)) as unknown as QueryParams;
    const t = new TaskHandlerService().getTaskFromSession<TrackerTask>();
    if (t) setTask(t);
    // Don't trust the saved card: load the server's current card. If it's a
    // tracker, use it (fresh target); otherwise the server is elsewhere and we
    // navigate there. Only start /awty pings once we know we belong here.
    syncTaskPageWithServer(p).then((r) => {
      if (!r) { setParams(p); return; }
      if (r.changed && r.task.type !== 'tracker') return;
      setTask(r.task as TrackerTask);
      setParams(p);
    }).catch(() => setParams(p));
  }, [testTask]);

  const maxRange = task?.max_range_m && task.max_range_m > 0 ? task.max_range_m : TRACKER_DEFAULT_RANGE_M;
  const colors = { ...TRACKER_DEFAULT_COLORS, ...(task?.colors || {}) };

  const gpsDistance = position && task?.target
    ? getDistanceInMeters(position.lat, position.lng, task.target.lat, task.target.lng)
    : null;
  const distance = isTestMode && testDistance != null ? testDistance : gpsDistance;
  const signal = distance == null ? 0 : trackerSignal(distance, maxRange);
  const lit = trackerLitRings(signal, RINGS);
  const message = distance == null
    ? (error ? 'Tracker can’t find your location. Check location is switched on for this site.' : 'Searching for signal…')
    : trackerMessage(distance, task?.messages, task?.out_of_range_message);

  // Same arrival loop as the map page: every GPS update pings /awty (5s cooldown).
  useEffect(() => {
    if (!position || !params || (isTestMode && testDistance != null)) return;
    if (awtyPending.current) return;
    awtyPending.current = true;
    new APIService(Endpoint.Awty)
      .post<AwtyResponse>(
        {
          lat: position.lat, lng: position.lng, accuracy: position.accuracy ?? 10,
          task_id: new TaskHandlerService().getPrevTaskIdFromSession() ?? null,
          user_id: params.user_id, trail_ref: params.trail_ref
        },
        { user_id: params.user_id, trail_ref: params.trail_ref }
      )
      .then((data) => {
        if (!data?.task) return;
        setNextTask(data.task);
        if ((data.outcome?.items ?? []).length > 0) { setItems(data.outcome!.items!); setOpen(true); }
        else new TaskHandlerService().goToTaskComponent(data.task, params);
      })
      .catch((e) => console.error('Tracker AWTY error', e))
      .finally(() => { setTimeout(() => { awtyPending.current = false; }, AWTY_INTERVAL); });
  }, [position, params, isTestMode, testDistance]);

  // Beep loop. Re-reads the latest signal each tick so cadence follows the player.
  const signalRef = useRef(0);
  signalRef.current = signal;
  useEffect(() => {
    if (!started) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const b = trackerBeep(signalRef.current);
      if (!b) { timer = setTimeout(tick, 500); return; }
      setPulse((p) => p + 1);
      if (!mutedRef.current) playBeep(b.freqHz, b.rate);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(signalRef.current > 0.8 ? 60 : 30); } catch { /* no-op */ }
      }
      timer = setTimeout(tick, b.intervalMs);
    };
    tick();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const playBeep = (freq: number, rate: number) => {
    if (task?.beep_url && beepEl.current) {
      const a = beepEl.current.cloneNode() as HTMLAudioElement;
      a.playbackRate = rate;
      a.play().catch(() => undefined);
      return;
    }
    const ctx = audioCtx.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  };

  const start = () => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) { audioCtx.current = new AC(); audioCtx.current.resume(); }
    } catch { /* audio unavailable: visuals still work */ }
    if (task?.beep_url) {
      beepEl.current = new Audio(task.beep_url);
      beepEl.current.load();
    }
    setStarted(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (nextTask) new TaskHandlerService().goToTaskComponent(nextTask, params as QueryParams);
  };

  if (!task) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: colors.background, color: colors.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      padding: '72px 20px 32px', zIndex: 900, fontFamily: 'inherit', textAlign: 'center' }}>
      <style>{`@keyframes twimpTrackerPing{from{transform:scale(.2);opacity:.9}to{transform:scale(1);opacity:0}}`}</style>
      <div>
        {task.title && <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{task.title}</h1>}
        {task.content && <p style={{ fontSize: 17, marginTop: 8, opacity: 0.9 }}>{task.content}</p>}
      </div>

      <div style={{ position: 'relative', width: 'min(80vw, 46vh)', aspectRatio: '1 / 1' }}>
        {Array.from({ length: RINGS }).map((_, i) => {
          const size = 100 - i * (80 / RINGS); // outer ring = faint, inner = close
          const isLit = i >= RINGS - lit;
          return (
            <div key={i} style={{ position: 'absolute', left: `${(100 - size) / 2}%`, top: `${(100 - size) / 2}%`,
              width: `${size}%`, height: `${size}%`, borderRadius: '50%',
              border: `3px solid ${colors.signal}`, opacity: isLit ? 1 : 0.15,
              boxShadow: isLit ? `0 0 14px ${colors.signal}` : 'none', transition: 'opacity .3s' }} />
          );
        })}
        <div style={{ position: 'absolute', left: '40%', top: '40%', width: '20%', height: '20%', borderRadius: '50%',
          background: colors.signal, opacity: signal > 0 ? 0.4 + 0.6 * signal : 0.15 }} />
        {started && signal > 0 && (
          <div key={pulse} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${colors.signal}`,
            animation: 'twimpTrackerPing .7s ease-out forwards' }} />
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <p style={{ fontSize: 22, fontWeight: 700, minHeight: 32, margin: '0 0 16px' }}>{started ? message : ''}</p>
        {isTestMode && (
          <label style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
            Test distance: {testDistance == null ? 'GPS' : `${Math.round(testDistance)} m`}
            <input type="range" min={0} max={maxRange + 20} value={testDistance ?? maxRange + 20}
              onChange={(e) => setTestDistance(Number(e.target.value))} style={{ width: '100%' }} />
          </label>
        )}
        {!started ? (
          <button onClick={start} style={{ background: colors.signal, color: colors.background, border: 0,
            borderRadius: 999, padding: '14px 32px', fontSize: 18, fontWeight: 700 }}>Start tracking</button>
        ) : (
          <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}
            style={{ background: 'transparent', color: colors.text, border: `2px solid ${colors.text}`,
              borderRadius: 999, padding: '8px 20px', fontSize: 15 }}>{muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
        )}
      </div>
      <ItemsDialog items={items} open={open} handleClose={handleClose} />
    </div>
  );
}
