import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { JournalContent } from '@/components/JournalDialog';
import InventoryTab from '@/pages/task/inventoryTab';
import SwipeCard from '@/components/SwipeCard';
import { TrailMeta } from '@/services/LocalItems';
// import MapTab from '@/pages/task/mapTab'; // TODO: "Map" tab once a map endpoint exists again

export type GamePageTab = 'journal' | 'items';

// Full-screen "game page" opened by swiping right on a card (or the back
// gesture). Tabs: Journal (default), Items, and an exit icon (Leave game).
// No header and no close button: swipe right (or left) to return to the card.
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

  useEffect(() => {
    setMounted(true);
    if (!open) return;
    const app = document.getElementById('__next');
    const scrollY = window.scrollY;
    const prev = app?.style.display ?? '';
    if (app) app.style.display = 'none';
    window.scrollTo(0, 0);
    return () => {
      if (app) app.style.display = prev;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open || !mounted) return null;
  // No open/close transition: the swipe itself is the transition, and the
  // view underneath is already rendered, so nothing should fade or flash.
  return createPortal(
    <Box data-testid="game-page" sx={{ minHeight: '100vh', bgcolor: 'background.paper', color: 'text.primary' }}>
      {/* Left or right swipe returns to the card (revealed underneath). */}
      <SwipeCard onSwipeRight={handleClose} onSwipeLeft={handleClose} underRight={underCard} underLeft={underCard}>
        <GamePageBody tab={tab} setTab={setTab} />
      </SwipeCard>
    </Box>,
    document.body
  );
}

/** Tabs + content. Also rendered (Journal tab) underneath a card while the
 *  player drags right, so the game page is already there when it opens. */
export function GamePageBody({ tab, setTab }: { tab: GamePageTab; setTab?: (t: GamePageTab) => void }) {
  const [confirm, setConfirm] = useState(false);
  // Items tab only when the trail has items_enabled (default true).
  const [itemsEnabled, setItemsEnabled] = useState(true);
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
        <Tabs
          value={shown}
          onChange={(_, v) => (v === 'exit' ? setTab && setConfirm(true) : setTab?.(v))}
          variant="standard"
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab value="journal" label="Journal" className="cy-tab-journal" sx={{ flex: 1 }} />
          {itemsEnabled && <Tab value="items" label="Items" className="cy-tab-items" sx={{ flex: 1 }} />}
          {/* Exit: compact icon-only tab, never selected; opens the confirm. */}
          <Tab
            value="exit"
            icon={<LogoutIcon />}
            aria-label="Leave game"
            data-testid="leave-game"
            sx={{ minWidth: 56, width: 56, px: 1, flex: '0 0 auto' }}
          />
        </Tabs>
      </AppBar>
      <Box sx={{ pb: 2 }}>
        {shown === 'journal' ? <JournalContent /> : <InventoryTab setItems={[]} refreshData={true} />}
      </Box>
      <LeaveConfirm open={confirm} onClose={() => setConfirm(false)} />
    </>
  );
}

/** Leave game confirm (from the exit tab). Progress is kept — local
 *  batch/journal and the server session are untouched, so Continue on the
 *  game's intro page resumes the same card. */
function LeaveConfirm({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} data-testid="leave-confirm">
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogContent>Your progress is saved — you can continue later from the home page.</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Stay</Button>
        <Button onClick={() => window.location.assign('/')} data-testid="leave-confirm-yes">
          Leave
        </Button>
      </DialogActions>
    </Dialog>
  );
}
