import { useState } from 'react';
import { AppBar, Box, Dialog, IconButton, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { JournalContent } from '@/components/JournalDialog';
import InventoryTab from '@/pages/task/inventoryTab';
import SwipeCard from '@/components/SwipeCard';
// import MapTab from '@/pages/task/mapTab'; // TODO: third "Map" tab once a map endpoint exists again

export type GamePageTab = 'journal' | 'items';

// Full-screen "game page" opened by swiping right on a card (or the back
// gesture). Tabs: Journal (default) and Items (the old inventory).
// Close with the X or by swiping left.
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
      <SwipeCard
        onSwipeLeft={() => {
          handleClose();
        }}
      >
        <AppBar sx={{ position: 'sticky', top: 0, paddingTop: '30px' }}>
          <Toolbar>
            <IconButton
              className="cy-game-page-close"
              edge="start"
              sx={{ color: '#fff' }}
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 1, flex: 1 }} variant="h6">
              {tab === 'journal' ? 'Journal' : 'Items'}
            </Typography>
          </Toolbar>
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
