import { useState } from 'react';
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
  initialTab = 'journal'
}: {
  open: boolean;
  handleClose: () => void;
  initialTab?: GamePageTab;
}) {
  const [tab, setTab] = useState<GamePageTab>(initialTab);

  return (
    <Dialog open={open} onClose={handleClose} fullScreen data-testid="game-page">
      <SwipeCard onSwipeRight={handleClose} onSwipeLeft={handleClose}>
        <AppBar
          sx={{ position: 'sticky', top: 0, paddingTop: 'env(safe-area-inset-top)' }}
          data-testid="game-page-tabs"
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
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
      </SwipeCard>
    </Dialog>
  );
}
