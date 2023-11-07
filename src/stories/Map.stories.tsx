import { Meta, StoryFn } from '@storybook/react';

import Map from '../pages/t/map';
import { withQuery } from '@storybook/addon-queryparams';
import { MapTask } from '@/typings/Task';
import { TaskType } from '@/typings/TaskType.enum';
import { Colour } from '@/typings/Colour.enum';

const task: MapTask = {
  ok: true,
  type: TaskType.Map,
  content: 'You should go here...',
  required: true,
  markers: [
    {
      lat: 51.503273708539716,
      lng: -0.10895379433126426,
      colour: Colour.Red,
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
