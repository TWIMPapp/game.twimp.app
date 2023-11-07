import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import Map from '../src/pages/task/map';
import { withQuery } from '@storybook/addon-queryparams';

const task = {
  ok: true,
  type: 'map',
  content: 'You should go here...',
  required: true,
  markers: [
    {
      lat: 51.503273708539716,
      lng: -0.10895379433126426,
      colour: 'red',
      title: 'London',
      subtitle: 'Capital of England'
    }
  ]
};

const meta: Meta<typeof Map> = {
  title: 'Tasks/Map',
  component: Map,
  decorators: [withQuery],
  parameters: {
    query: {
      task: JSON.stringify(task)
    }
  }
};

const MapTemplate: StoryFn<typeof Map> = (args) => {
  return <Map></Map>;
};

export const DefaultState = MapTemplate.bind({});

export default meta;
