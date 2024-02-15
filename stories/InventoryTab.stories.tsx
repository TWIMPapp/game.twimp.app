import React from 'react';
import { StoryFn } from '@storybook/react';

import InventoryTab from '../src/pages/task/inventoryTab';
import { withQuery } from '@storybook/addon-queryparams';

const collections = [
  {
    title: 'Dagger',
    image_url: 'https://picsum.photos/200',
    thumb_url: 'https://picsum.photos/200',
    sentiment: 'positive'
  },
  {
    title: 'Sword',
    image_url: 'https://picsum.photos/200',
    thumb_url: 'https://picsum.photos/200',
    sentiment: 'neutral'
  },
  {
    title: 'Shield',
    image_url: 'https://picsum.photos/200',
    thumb_url: 'https://picsum.photos/200',
    sentiment: 'positive'
  },
  {
    title: 'Hat',
    image_url: 'https://picsum.photos/200',
    thumb_url: 'https://picsum.photos/200',
    sentiment: 'negative'
  }
];

export default {
  title: 'Tasks/Inventory Tab',
  component: InventoryTab,
  decorators: [withQuery],
  parameters: {
    query: {
      user_id: 2,
      trail_ref: 'Bristol-AnniesMurder'
    }
  }
};

const InventoryTabTemplate: StoryFn<typeof InventoryTab> = (args) => {
  return <InventoryTab setItems={collections} refreshData={true}></InventoryTab>;
};

export const DefaultState = InventoryTabTemplate.bind({});
