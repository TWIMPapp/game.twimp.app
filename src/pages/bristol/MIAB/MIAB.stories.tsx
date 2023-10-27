import { StoryFn } from '@storybook/react';

import MIAB from './MIAB';

export default {
  title: 'Pages/Bristol/MIAB',
  component: MIAB
};

const MIABTemplate: StoryFn<typeof MIAB> = (args) => {
  return <MIAB></MIAB>;
};

export const DefaultState = MIABTemplate.bind({});
