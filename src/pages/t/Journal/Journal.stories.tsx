import { StoryFn } from '@storybook/react';

import Journal from './Journal';

export default {
  title: 'Tasks/Journal',
  component: Journal
};

const JournalTemplate: StoryFn<typeof Journal> = (args) => {
  return <Journal></Journal>;
};

export const DefaultState = JournalTemplate.bind({});
