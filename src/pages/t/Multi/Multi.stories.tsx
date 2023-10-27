import { StoryFn } from '@storybook/react';

import Multi from './Multi';

export default {
  title: 'Tasks/Multi',
  component: Multi
};

const MultiTemplate: StoryFn<typeof Multi> = (args) => {
  return <Multi></Multi>;
};

export const DefaultState = MultiTemplate.bind({});
