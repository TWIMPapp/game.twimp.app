import React from 'react';
import { StoryFn } from '@storybook/react';

import JournalDialog from '../src/components/JournalDialog';
import { withQuery } from '@storybook/addon-queryparams';

export default {
  title: 'Components/Journal',
  component: JournalDialog,
  decorators: [withQuery],
  parameters: {
    query: {
      user_id: 2,
      trail_ref: 'Bristol-AnniesMurder'
    }
  }
};

const JournalDialogTemplate: StoryFn<typeof JournalDialog> = (args) => {
  return <JournalDialog open={true} handleClose={() => ''}></JournalDialog>;
};

export const DefaultState = JournalDialogTemplate.bind({});
