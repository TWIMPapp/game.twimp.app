import { ReactNode, useEffect, useRef, useState } from 'react';

// Tinder-style horizontal swipe wrapper for story cards.
//  - Only horizontal-dominant drags count (|dx| > |dy| * 1.5).
//  - Drags starting within EDGE_GUARD px of either screen edge are ignored so
//    the phone's own edge-swipe (back gesture) keeps working.
//  - Vertical scrolling is untouched (touch-action: pan-y).
//  - Works with touch, pen and mouse (pointer events) for desktop testing.
// onSwipeLeft may return false (or a promise of false) to snap the card back,
// e.g. when the server had no next task to give.

const EDGE_GUARD = 25;
const FLICK_VELOCITY = 0.6; // px per ms
const DIRECTION_RATIO = 1.5;
const IGNORE_SELECTOR = 'input, textarea, select, audio, video, [data-noswipe]';

interface SwipeCardProps {
  children: ReactNode;
  onSwipeLeft?: () => boolean | void | Promise<boolean | void>;
  onSwipeRight?: () => void;
  /** Called on any completed swipe (used to dismiss the tutorial). */
  onAnySwipe?: () => void;
  className?: string;
  /** First-card tutorial: the whole card peels left then right, revealing hints. */
  demo?: boolean;
  /** Called on the first touch while the demo is playing. */
  onDemoTap?: () => void;
}

export default function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onAnySwipe,
  className,
  demo,
  onDemoTap
}: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const start = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const locked = useRef<'h' | 'v' | null>(null);
  const dragged = useRef(false);
  const dxRef = useRef(0);

  // Stop the browser's own horizontal overscroll / history swipe on card pages.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = [html.style.overscrollBehaviorX, body.style.overscrollBehaviorX];
    html.style.overscrollBehaviorX = 'none';
    body.style.overscrollBehaviorX = 'none';
    return () => {
      html.style.overscrollBehaviorX = prev[0];
      body.style.overscrollBehaviorX = prev[1];
    };
  }, []);

  const setOffset = (v: number) => {
    dxRef.current = v;
    setDx(v);
  };

  const snapBack = () => {
    setAnimating(true);
    setOffset(0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (demo) onDemoTap?.();
    if (animating && dxRef.current !== 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const w = window.innerWidth;
    if (e.clientX < EDGE_GUARD || e.clientX > w - EDGE_GUARD) return;
    if ((e.target as HTMLElement).closest?.(IGNORE_SELECTOR)) return;
    start.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    locked.current = null;
    dragged.current = false;
    setAnimating(false);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!locked.current) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      locked.current = Math.abs(mx) > Math.abs(my) * DIRECTION_RATIO ? 'h' : 'v';
      if (locked.current === 'h') {
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    }
    if (locked.current !== 'h') return;
    dragged.current = true;
    let v = mx;
    // Resist in directions that do nothing.
    if ((v < 0 && !onSwipeLeft) || (v > 0 && !onSwipeRight)) v = v / 6;
    setOffset(v);
  };

  const finish = async (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || s.id !== e.pointerId || locked.current !== 'h') {
      if (dxRef.current !== 0) snapBack();
      return;
    }
    const w = window.innerWidth;
    const v = dxRef.current;
    const elapsed = Math.max(1, performance.now() - s.t);
    const speed = Math.abs(e.clientX - s.x) / elapsed;
    const passed = Math.abs(v) > w / 3 || (speed > FLICK_VELOCITY && Math.abs(v) > 40);

    if (passed && v < 0 && onSwipeLeft) {
      onAnySwipe?.();
      setAnimating(true);
      setOffset(-w * 1.3);
      const res = await onSwipeLeft();
      if (res === false) snapBack();
    } else if (passed && v > 0 && onSwipeRight) {
      onAnySwipe?.();
      onSwipeRight();
      snapBack();
    } else {
      snapBack();
    }
  };

  const onPointerCancel = () => {
    start.current = null;
    if (dxRef.current !== 0) snapBack();
  };

  // Swallow the click that follows a drag so buttons under the finger don't fire.
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) {
      e.preventDefault();
      e.stopPropagation();
      dragged.current = false;
    }
  };

  const rotate = dx / 40;
  const demoOn = !!demo && dx === 0 && !animating;

  return (
    <div
      className={'relative w-full min-h-screen overflow-x-hidden ' + (className ?? '')}
      style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
      data-testid="swipe-card"
    >
      {demoOn && (
        <div
          aria-hidden
          className="fixed inset-0 bg-slate-800 pointer-events-none select-none"
          style={{ zIndex: 0 }}
          data-testid="swipe-tutorial"
        >
          <div className="swipe-demo-hint swipe-demo-hint-left absolute top-1/2 right-5 text-right text-white">
            <div className="text-3xl">&larr;</div>
            <div className="text-xl font-bold">Swipe left</div>
            <div className="text-xs opacity-80">Next</div>
          </div>
          <div className="swipe-demo-hint swipe-demo-hint-right absolute top-1/2 left-5 text-white">
            <div className="text-3xl">&rarr;</div>
            <div className="text-xl font-bold">Swipe right</div>
            <div className="text-xs opacity-80">Journal &amp; Items</div>
          </div>
        </div>
      )}
      <div
        className={'relative w-full min-h-screen' + (demoOn ? ' swipe-demo-card bg-white dark:bg-gray-800' : '')}
        style={{
          zIndex: demoOn ? 1 : undefined,
          transform: dx ? `translateX(${dx}px) rotate(${rotate}deg)` : undefined,
          transformOrigin: '50% 100%',
          transition: animating ? 'transform 300ms ease-out' : 'none',
          userSelect: dx ? 'none' : undefined
        }}
        onTransitionEnd={() => setAnimating(false)}
      >
        {children}
      </div>
    </div>
  );
}
