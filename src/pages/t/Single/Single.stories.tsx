import { StoryFn } from '@storybook/react';

import Single from './Single';

export default {
  title: 'Tasks/Single',
  component: Single
};

const SingleTemplate: StoryFn<typeof Single> = (args) => {
  return <Single></Single>;
};

export const DefaultState = SingleTemplate.bind({});
