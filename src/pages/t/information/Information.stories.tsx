import { StoryFn } from '@storybook/react';

import Information from './index';

export default {
  title: 'Tasks/Info',
  component: Information
};

const InfoTemplate: StoryFn<typeof Information> = (args) => {
  return <Information></Information>;
};

export const DefaultState = InfoTemplate.bind({});
