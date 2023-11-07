import React from 'react';
import { StoryFn } from '@storybook/react';

import Journal from '../src/pages/task/journal';

export default {
  title: 'Tasks/Journal',
  component: Journal
};

const JournalTemplate: StoryFn<typeof Journal> = (args) => {
  return <Journal></Journal>;
};

export const DefaultState = JournalTemplate.bind({});
