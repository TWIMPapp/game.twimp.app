import { StoryFn } from '@storybook/react';

import Single from '../pages/t/single';

export default {
  title: 'Tasks/Question Single',
  component: Single
};

const SingleTemplate: StoryFn<typeof Single> = (args) => {
  return <Single></Single>;
};

export const DefaultState = SingleTemplate.bind({});
