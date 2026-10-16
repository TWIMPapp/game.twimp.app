import { useCallback, useEffect, useState } from 'react';

export const TUTORIAL_KEY = 'swipe_tutorial_pending';

// Shared state for card pages: the swipe-right game page, and the browser
// back gesture being redirected to it instead of leaving the game.
// Task changes are full page loads (window.location.assign), so each card page
// pushes its own guard history entry on mount.
export function useGamePage() {
  const [gamePageOpen, setGamePageOpen] = useState(false);

  useEffect(() => {
    const pushGuard = () => {
      try {
        window.history.pushState({ twimpGuard: true }, '', window.location.href);
      } catch {
        /* ignore */
      }
    };
    if (!window.history.state?.twimpGuard) pushGuard();
    const onPopState = () => {
      // The back gesture popped our guard: open the journal and re-arm.
      setGamePageOpen(true);
      pushGuard();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openGamePage = useCallback(() => setGamePageOpen(true), []);
  const closeGamePage = useCallback(() => setGamePageOpen(false), []);
  return { gamePageOpen, openGamePage, closeGamePage };
}

// Tutorial shows on the first story card of each game: game/[ref] sets the
// pending flag on Start, and it's also shown for a Safety Guidelines card.
export function useSwipeTutorial(content?: string) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (content === undefined) return;
    const pending = sessionStorage.getItem(TUTORIAL_KEY) === '1';
    const isSafety = /safety/i.test(content.slice(0, 300));
    if (pending || isSafety) setShow(true);
  }, [content]);
  const dismiss = useCallback(() => {
    sessionStorage.removeItem(TUTORIAL_KEY);
    setShow(false);
  }, []);
  return { showTutorial: show, dismissTutorial: dismiss };
}
