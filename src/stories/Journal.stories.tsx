import { StoryFn } from '@storybook/react';

import Journal from '../pages/t/journal';

export default {
  title: 'Tasks/Journal',
  component: Journal
};

const JournalTemplate: StoryFn<typeof Journal> = (args) => {
  return <Journal></Journal>;
};

export const DefaultState = JournalTemplate.bind({});
