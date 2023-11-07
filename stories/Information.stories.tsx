import React from 'react';
import { StoryFn } from '@storybook/react';

import Information from '../src/pages/task/information';

export default {
  title: 'Tasks/Information',
  component: Information
};

const InfoTemplate: StoryFn<typeof Information> = (args) => {
  return <Information></Information>;
};

export const DefaultState = InfoTemplate.bind({});
