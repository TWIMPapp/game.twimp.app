import { StoryFn } from '@storybook/react';

import Finish from '../src/pages/t/finish';

export default {
  title: 'Tasks/Finish',
  component: Finish
};

const InfoTemplate: StoryFn<typeof Finish> = (args) => {
  return <Finish></Finish>;
};

export const DefaultState = InfoTemplate.bind({});
