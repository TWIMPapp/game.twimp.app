import React from 'react';
import { StoryFn } from '@storybook/react';

import Single from '../src/pages/task/single';
import { withQuery } from '@storybook/addon-queryparams';

const task = {
  ok: true,
  type: 'question_multi',
  image_url:
    'https://d3i6fh83elv35t.cloudfront.net/newshour/app/uploads/2016/07/apollogiftweet1.gif',
  content:
    'What number was the <strong>Apollo mission</strong> that successfully put a man on the moon for the first time in <strong>human history</strong>?',
  hint: 'The answer is between 11 and 14',
  required: true
};

export default {
  title: 'Tasks/Question Single',
  component: Single,
  decorators: [withQuery],
  parameters: {
    query: {
      task: JSON.stringify(task)
    }
  }
};

const SingleTemplate: StoryFn<typeof Single> = (args) => {
  return <Single></Single>;
};

export const DefaultState = SingleTemplate.bind({});
