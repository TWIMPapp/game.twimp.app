import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { withQuery } from '@storybook/addon-queryparams';

import Multi from '../src/pages/task/multi';

const task = {
  ok: true,
  type: 'question_multi',
  image_url:
    'https://d3i6fh83elv35t.cloudfront.net/newshour/app/uploads/2016/07/apollogiftweet1.gif',
  content:
    'What number was the <strong>Apollo mission</strong> that successfully put a man on the moon for the first time in <strong>human history</strong>?',
  hint: 'The answer is between 11 and 14',
  required: true,
  options: [
    {
      content: 'Apollo 11',
      colour: 'blue'
    },
    {
      content: 'Apollo 12',
      colour: 'yellow'
    },
    {
      content: 'Apollo 13',
      colour: 'purple'
    },
    {
      content: 'Apollo 14',
      colour: 'red'
    }
  ]
};

const meta: Meta<typeof Multi> = {
  title: 'Tasks/Question Multi',
  component: Multi,
  decorators: [withQuery],
  parameters: {
    query: {
      task: JSON.stringify(task)
    }
  }
};

const MultiTemplate: StoryFn<typeof Multi> = (args) => {
  return <Multi></Multi>;
};

export const DefaultState = MultiTemplate.bind({});

export default meta;
