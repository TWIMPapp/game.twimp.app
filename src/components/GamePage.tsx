import { ReactNode, useState } from 'react';
import { AppBar, Box, Dialog, Tab, Tabs } from '@mui/material';
import { JournalContent } from '@/components/JournalDialog';
import InventoryTab from '@/pages/task/inventoryTab';
import SwipeCard from '@/components/SwipeCard';
// import MapTab from '@/pages/task/mapTab'; // TODO: third "Map" tab once a map endpoint exists again

export type GamePageTab = 'journal' | 'items';

// Full-screen "game page" opened by swiping right on a card (or the back
// gesture). Tabs: Journal (default) and Items. No header and no close button:
// swipe right (or left) to return to the card.
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

  return (
    // No open/close transition: the swipe itself is the transition, and the
    // view underneath is already rendered, so nothing should fade or flash.
    <Dialog open={open} onClose={handleClose} fullScreen transitionDuration={0} data-testid="game-page">
      <SwipeCard onSwipeRight={handleClose} onSwipeLeft={handleClose} underRight={underCard}>
        <GamePageBody tab={tab} setTab={setTab} />
      </SwipeCard>
    </Dialog>
  );
}

/** Tabs + content. Also rendered (Journal tab) underneath a card while the
 *  player drags right, so the game page is already there when it opens. */
export function GamePageBody({ tab, setTab }: { tab: GamePageTab; setTab?: (t: GamePageTab) => void }) {
  return (
    <>
      <AppBar
        sx={{ position: 'sticky', top: 0, paddingTop: 'env(safe-area-inset-top)' }}
        data-testid="game-page-tabs"
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab?.(v)}
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab value="journal" label="Journal" className="cy-tab-journal" />
          <Tab value="items" label="Items" className="cy-tab-items" />
        </Tabs>
      </AppBar>
      <Box sx={{ pb: 8 }}>
        {tab === 'journal' ? <JournalContent /> : <InventoryTab setItems={[]} refreshData={true} />}
      </Box>
    </>
  );
}
