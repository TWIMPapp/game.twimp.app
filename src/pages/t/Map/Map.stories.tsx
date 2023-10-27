import { StoryFn } from '@storybook/react';

import Map from './Map';

export default {
  title: 'Tasks/Map',
  component: Map
};

const MapTemplate: StoryFn<typeof Map> = (args) => {
  return <Map></Map>;
};

export const DefaultState = MapTemplate.bind({});
