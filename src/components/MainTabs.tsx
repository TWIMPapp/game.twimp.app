import { Tab, Tabs } from '@mui/material';
import { JSXElementConstructor, ReactElement, SyntheticEvent, useState } from 'react';
import BackpackIcon from '@mui/icons-material/Backpack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MapIcon from '@mui/icons-material/Map';
import InventoryTab from '@/pages/task/inventoryTab';
import MapTab from '@/pages/task/mapTab';

export const TabBarHeight = 68;

enum TabPage {
  InventoryTab,
  TaskTab,
  MapTab
}

const MainTabs = ({ children }: { children: ReactElement<any, any> }) => {
  const [activeTab, setActiveTab] = useState(TabPage.TaskTab);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Tabs
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
        <InventoryTab setItems={[]} refreshData={activeTab !== TabPage.InventoryTab} />
      </div>
      <div role="tabpanel" hidden={activeTab !== TabPage.TaskTab}>
        {children}
      </div>
      <div role="tabpanel" hidden={activeTab !== TabPage.MapTab}>
        <MapTab />
      </div>
    </>
  );
};

export default MainTabs;
