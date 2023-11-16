import React from 'react';
import { StoryFn } from '@storybook/react';

import MapTab from '../src/pages/task/mapTab';

export default {
  title: 'Tasks/Map Tab',
  component: MapTab
};

const MapTabTemplate: StoryFn<typeof MapTab> = (args) => {
  return <MapTab></MapTab>;
};

export const DefaultState = MapTabTemplate.bind({});
