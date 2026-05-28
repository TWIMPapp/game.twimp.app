import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Game } from '@/types';
import { BASE_URL } from '@/constants';
import { TaskHandlerService } from '@/services/TaskHandler';
import { TaskUnion } from '@/typings/Task';
import QueryParams from '@/typings/QueryParams';
import { ErrorBus } from '@/services/ErrorBus';

// Intermediary intro page for built-in walk games (e.g. Jasmarina). Shows the
// hero image, the full trail description, and the play buttons. Sits between
// the home grid and the /task/map play loop.
//
// Button rules:
//   - never played      → [ Start ]                       (one button, primary)
//   - mid-game          → [ Continue ] [ Start Again ]    (Continue primary, Start Again secondary)
//   - finished          → [ Start Again ]                 (one button, primary)
//
// Continue resumes the exact task the player left off on (TODO: long-term,
// rewind to the first screen of a multi-part task for nicer UX — needs the
// engine to expose task-group boundaries). Start / Start Again restart the
// session then drop into the map at the first pin.

type SessionState = 'none' | 'in_progress' | 'finished';

const userId = () =>
  (typeof window !== 'undefined' && localStorage.getItem('twimp_user_id')) || '';

export default function GameIntro() {
  const router = useRouter();
  const { ref } = router.query;

  const [game, setGame] = useState<Game | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('none');
  const [resumeTask, setResumeTask] = useState<TaskUnion | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!ref || typeof ref !== 'string') return;
    const uid = userId();

    const load = async () => {
      // Game details: prefer the object the home page stashed on click; fall
      // back to /list (covers refresh / direct navigation).
      let g: Game | null = null;
      const cached = sessionStorage.getItem('intro_game');
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Game;
          if (parsed.ref === ref) g = parsed;
        } catch { /* ignore */ }
      }
      if (!g) {
        try {
          const res = await fetch(`${BASE_URL}/list?user_id=${encodeURIComponent(uid)}`);
          if (res.ok) {
            const data = await res.json();
            const all: Game[] = [
              ...(data.featured || []), ...(data.all || []),
              ...(data.playAgain || []), ...(data.nearYou || []),
            ];
            g = all.find(x => x.ref === ref) || null;
          }
        } catch { /* ignore */ }
      }
      setGame(g);

      // Session state: only call /play when there's a session to inspect — /play
      // on a brand-new game would create one (sets playStart), which we don't
      // want from a passive intro screen.
      if (g?.hasSession) {
        try {
          const res = await fetch(`${BASE_URL}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_ref: ref, user_id: uid }),
          });
          const data = await res.json();
          const result = data.body || data;
          if (result?.ok && result.task) {
            setResumeTask(result.task);
            setSessionState(result.task.type === 'finish' ? 'finished' : 'in_progress');
          }
        } catch { /* leave as 'none' */ }
      }

      setLoading(false);
    };

    load();
  }, [ref]);

  const handleContinue = () => {
    if (!resumeTask || typeof ref !== 'string') return;
    const params: QueryParams = { trail_ref: ref, user_id: userId() } as QueryParams;
    new TaskHandlerService().goToTaskComponent(resumeTask, params);
  };

  const handleStart = async () => {
    if (typeof ref !== 'string') return;
    setWorking(true);
    const uid = userId();
    try {
      // Restart wipes the session; /play then returns the fresh start map task.
      await fetch(`${BASE_URL}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_ref: ref, user_id: uid, action: 'restart' }),
      });
      const res = await fetch(`${BASE_URL}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_ref: ref, user_id: uid }),
      });
      const data = await res.json();
      const result = data.body || data;
      if (result?.ok && result.task) {
        sessionStorage.setItem('task', JSON.stringify(result.task));
        router.push(`/task/map?trail_ref=${encodeURIComponent(ref)}&user_id=${encodeURIComponent(uid)}`);
      } else {
        ErrorBus.emit("Couldn't start the trail. Please try again.");
        setWorking(false);
      }
    } catch {
      ErrorBus.emit("Couldn't start the trail. Please try again.");
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!game) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', p: 3, gap: 2 }}>
        <Typography variant="h6">Trail not found</Typography>
        <Button variant="contained" onClick={() => router.push('/')}>Back to games</Button>
      </Box>
    );
  }

  const showContinue = sessionState === 'in_progress';
  const startLabel = sessionState === 'none' ? 'Start' : 'Start Again';

  return (
    // Fixed-height column: hero (fixed) + description (scrolls) + footer (fixed).
    // Guarantees the buttons are always reachable no matter how long the
    // description is. 100dvh tracks mobile browser chrome so the footer isn't
    // hidden behind it.
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <Box
        sx={{
          flexShrink: 0,
          height: '38dvh',
          backgroundImage: `url(${game.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
          {game.name}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {game.description}
        </Typography>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          gap: 2,
          p: 2,
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: 'background.paper',
        }}
      >
        {showContinue && (
          <Button variant="contained" size="large" fullWidth onClick={handleContinue}>
            Continue
          </Button>
        )}
        <Button
          variant={showContinue ? 'outlined' : 'contained'}
          size="large"
          fullWidth
          disabled={working}
          onClick={handleStart}
        >
          {working ? 'Starting…' : startLabel}
        </Button>
      </Box>
    </Box>
  );
}
