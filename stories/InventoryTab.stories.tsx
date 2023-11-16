import React from 'react';
import { StoryFn } from '@storybook/react';

import InventoryTab from '../src/pages/task/inventoryTab';

export default {
  title: 'Tasks/Inventory Tab',
  component: InventoryTab
};

const InventoryTabTemplate: StoryFn<typeof InventoryTab> = (args) => {
  return <InventoryTab></InventoryTab>;
};

export const DefaultState = InventoryTabTemplate.bind({});
