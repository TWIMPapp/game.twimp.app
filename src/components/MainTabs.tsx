import { Page } from '@/typings/Page.enum';
import { Tab, Tabs } from '@mui/material';
import { JSXElementConstructor, ReactElement, useState } from 'react';
import BackpackIcon from '@mui/icons-material/Backpack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MapIcon from '@mui/icons-material/Map';

export const TabBarHeight = 68;

interface LinkTabProps {
  icon?: ReactElement<any, string | JSXElementConstructor<any>>;
  label?: string;
  href?: string;
}

function samePageLinkNavigation(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false;
  }
  return true;
}

function LinkTab(props: LinkTabProps) {
  return <Tab component="a" icon={props.icon} aria-label={props.label} {...props} />;
}

const PageMap = {
  [Page.InventoryTab]: 0,
  [Page.MapTab]: 2
};

const MainTabs = ({ componentDisplayName }: { componentDisplayName?: string }) => {
  const [activeTab, setActiveTab] = useState(
    componentDisplayName && (PageMap as any)[componentDisplayName] > -1
      ? (PageMap as any)[componentDisplayName]
      : 1
  );

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    // event.type can be equal to focus with selectionFollowsFocus.
    if (
      event.type !== 'click' ||
      (event.type === 'click' &&
        samePageLinkNavigation(event as React.MouseEvent<HTMLAnchorElement, MouseEvent>))
    ) {
      setActiveTab(newValue);
    }
  };
  return (
    <Tabs
      className="game__tabs"
      value={activeTab}
      onChange={handleChange}
      aria-label="tabs"
      variant="fullWidth"
      sx={{ height: `${TabBarHeight + 40}px` }}
    >
      <LinkTab icon={<BackpackIcon />} aria-label="Inventory" href="/task/inventoryTab" />
      {/* TODO: Route to handler */}
      <LinkTab icon={<AssignmentIcon />} aria-label="Task" href="/task/multi" />
      <LinkTab icon={<MapIcon />} aria-label="Map" href="/task/mapTab" />
    </Tabs>
  );
};

export default MainTabs;
