import { StoryFn } from '@storybook/react';

import Info from './Info';

export default {
  title: 'Tasks/Info',
  component: Info
};

const InfoTemplate: StoryFn<typeof Info> = (args) => {
  return <Info></Info>;
};

export const DefaultState = InfoTemplate.bind({});
