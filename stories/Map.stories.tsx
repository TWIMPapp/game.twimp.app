import React from 'react';
import { StoryFn } from '@storybook/react';

import Map from '../src/pages/task/map';
import { MapTask } from '../src/typings/Task';
import { TaskType } from '../src/typings/TaskType.enum';
import { Colour } from '../src/typings/Colour.enum';

const task: MapTask = {
  ok: true,
  id: 1,
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

export default {
  title: 'Tasks/Map',
  component: Map
};

const MapTemplateLight: StoryFn<typeof Map> = (args) => {
  document.documentElement.classList.remove('dark');
  return <Map testTask={task}></Map>;
};

const MapTemplateDark: StoryFn<typeof Map> = (args) => {
  document.documentElement.classList.add('dark');
  return <Map testTask={task}></Map>;
};

export const LightState = MapTemplateLight.bind({});
export const DarkState = MapTemplateDark.bind({});
