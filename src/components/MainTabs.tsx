import { Tab, Tabs } from '@mui/material';
import { JSXElementConstructor, ReactElement, SyntheticEvent, useState } from 'react';
import BackpackIcon from '@mui/icons-material/Backpack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MapIcon from '@mui/icons-material/Map';
import InventoryTab from '@/pages/task/inventoryTab';
import MapTab from '@/pages/task/mapTab';
import { TabBarHeight } from './TabBarHeight';

enum TabPage {
  InventoryTab,
  TaskTab,
  MapTab
}

const MainTabs = ({ children, hidden }: { children: ReactElement<any, any>; hidden: boolean }) => {
  const [activeTab, setActiveTab] = useState(TabPage.TaskTab);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Tabs
        hidden={hidden}
        className="game__tabs"
        value={activeTab}
        onChange={handleChange}
        aria-label="tabs"
        variant="fullWidth"
        sx={{ height: `${TabBarHeight + 40}px` }}
      >
        <Tab icon={<BackpackIcon />} aria-label="Inventory" />
        <Tab icon={<AssignmentIcon />} aria-label="Task" />
        <Tab icon={<MapIcon />} aria-label="Map" />
      </Tabs>

      <div role="tabpanel" hidden={activeTab !== TabPage.InventoryTab}>
        {activeTab === TabPage.InventoryTab && (
          <InventoryTab setItems={[]} refreshData={activeTab !== TabPage.InventoryTab} />
        )}
      </div>
      <div role="tabpanel" className="h-full" hidden={activeTab !== TabPage.TaskTab}>
        {children}
      </div>
      <div role="tabpanel" hidden={activeTab !== TabPage.MapTab}>
        <MapTab refreshData={false} />
      </div>
    </>
  );
};

export default MainTabs;
