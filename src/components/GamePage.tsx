import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tab, Tabs } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LogoutIcon from '@mui/icons-material/Logout';
import { JournalContent } from '@/components/JournalDialog';
import InventoryTab from '@/pages/task/inventoryTab';
import SwipeCard, { SwipeCardHandle } from '@/components/SwipeCard';
import { TrailMeta } from '@/services/LocalItems';
// import MapTab from '@/pages/task/mapTab'; // TODO: "Map" tab once a map endpoint exists again

export type GamePageTab = 'journal' | 'items';

// Full-screen "game page" opened by swiping right on a card (or the back
// gesture). Tabs: Journal (default), Items, and a right-arrow icon to return
// to the game (same as swipe), plus a fixed bottom "Leave Game" button.
//
// Rendered as normal page content (portal into <body>, with the card page's
// #__next hidden while open) rather than a fixed MUI Dialog: a fixed Dialog
// locks <body> scrolling and scrolls its own inner container, which kills the
// mobile browser's pull-to-refresh (it only fires on the root scroller). With
// the window as the scroller, pull-to-refresh works on the Journal/Items.
// A reload lands back on the current card (the game page is not in the URL).
export default function GamePage({
  open,
  handleClose,
  initialTab = 'journal',
  underCard
}: {
  open: boolean;
  handleClose: () => void;
  initialTab?: GamePageTab;
  /** The current task card, pre-rendered underneath while swiping back. */
  underCard?: ReactNode;
}) {
  const [tab, setTab] = useState<GamePageTab>(initialTab);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const swipeRef = useRef<SwipeCardHandle | null>(null);
  const savedAppStateRef = useRef<{ prevDisplay: string; scrollY: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!open) {
      setClosing(false);
      return;
    }
    const app = document.getElementById('__next');
    const scrollY = window.scrollY;
    const prev = app?.style.display ?? '';
    savedAppStateRef.current = { prevDisplay: prev, scrollY };
    if (app) app.style.display = 'none';
    window.scrollTo(0, 0);
    return () => {
      if (app) app.style.display = prev;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const revealUnderlyingApp = useCallback(() => {
    if (underCard) return;
    const app = document.getElementById('__next');
    const saved = savedAppStateRef.current;
    if (app && saved) {
      app.style.display = saved.prevDisplay;
      window.scrollTo(0, saved.scrollY);
    }
    setClosing(true);
  }, [underCard]);

  const handleActiveTaskClick = useCallback(() => {
    revealUnderlyingApp();
    swipeRef.current?.triggerSwipe('left', handleClose);
  }, [revealUnderlyingApp, handleClose]);

  const handleSwipeLeft = useCallback(() => {
    revealUnderlyingApp();
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        handleClose();
        resolve(true);
      }, 260);
    });
  }, [revealUnderlyingApp, handleClose]);

  const handleSwipeRight = useCallback(() => {
    if (underCard) {
      handleClose();
      return;
    }
    revealUnderlyingApp();
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        handleClose();
        resolve(true);
      }, 260);
    });
  }, [underCard, revealUnderlyingApp, handleClose]);

  if (!open || !mounted) return null;
  // No open/close transition: the swipe itself is the transition, and the
  // view underneath is already rendered, so nothing should fade or flash.
  return createPortal(
    <Box
      data-testid="game-page"
      sx={
        closing && !underCard
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 1300,
              bgcolor: 'transparent',
              color: 'text.primary',
              overflow: 'hidden',
              pointerEvents: 'none'
            }
          : {
              minHeight: '100vh',
              bgcolor: 'background.paper',
              color: 'text.primary'
            }
      }
    >
      {/* Left or right swipe returns to the card (revealed underneath). */}
      <SwipeCard
        ref={swipeRef}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
        underRight={underCard}
        underLeft={underCard}
      >
        <GamePageBody tab={tab} setTab={setTab} onActiveTaskClick={handleActiveTaskClick} />
      </SwipeCard>
    </Box>,
    document.body
  );
}

/** Tabs + content. Also rendered (Journal tab) underneath a card while the
 *  player drags right, so the game page is already there when it opens. */
export function GamePageBody({
  tab,
  setTab,
  onActiveTaskClick
}: {
  tab: GamePageTab;
  setTab?: (t: GamePageTab) => void;
  onActiveTaskClick?: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  // Items tab only when the trail has items_enabled === true (unknown = hidden).
  const [itemsEnabled, setItemsEnabled] = useState(false);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('trail_ref') ?? undefined;
    setItemsEnabled(TrailMeta.itemsEnabled(ref));
  }, []);
  const shown: GamePageTab = !itemsEnabled && tab === 'items' ? 'journal' : tab;
  return (
    <>
      <AppBar
        sx={{ position: 'sticky', top: 0, paddingTop: 'env(safe-area-inset-top)' }}
        data-testid="game-page-tabs"
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <Tabs
            value={shown}
            onChange={(_, v) => {
              setTab?.(v);
            }}
            variant="fullWidth"
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ flex: 1, width: '100%' }}
          >
            <Tab
              value="journal"
              label="Journal"
              className="cy-tab-journal"
              sx={{ flex: 1, maxWidth: 'none' }}
            />
            {itemsEnabled && (
              <Tab
                value="items"
                label="Items"
                className="cy-tab-items"
                sx={{ flex: 1, maxWidth: 'none' }}
              />
            )}
          </Tabs>
          {/* Right arrow: same as swipe, animates back to the main game screen. */}
          <IconButton
            onClick={() => onActiveTaskClick?.()}
            aria-label="Return to game"
            data-testid="return-to-game"
            data-noswipe
            color="inherit"
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              zIndex: 1
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </AppBar>
      <Box sx={{ pb: 10 }}>
        {shown === 'journal' ? (
          <JournalContent onActiveTaskClick={onActiveTaskClick} />
        ) : (
          <InventoryTab setItems={[]} refreshData={true} />
        )}
      </Box>
      {/* Fixed Leave Game footer — unaffected by vertical scroll */}
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
          pt: 1.5,
          pb: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, rgba(246, 241, 231, 0.98) 65%, rgba(246, 241, 231, 0))',
          pointerEvents: 'none'
        }}
        data-testid="leave-game-bar"
      >
        <Button
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={() => setConfirm(true)}
          data-testid="leave-game"
          data-noswipe
          sx={{
            pointerEvents: 'auto',
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 0.9,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}
        >
          Leave Game
        </Button>
      </Box>
      <LeaveConfirm open={confirm} onClose={() => setConfirm(false)} />
    </>
  );
}

/** Leave game confirm (from the fixed Leave Game button). Progress is kept —
 *  local batch/journal and the server session are untouched, so Continue on the
 *  game's intro page resumes the same card. */
function LeaveConfirm({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} data-testid="leave-confirm">
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogContent>Your progress is saved — you can continue later from the home page.</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Stay</Button>
        <Button color="error" onClick={() => window.location.assign('/')}>
          Leave Game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
