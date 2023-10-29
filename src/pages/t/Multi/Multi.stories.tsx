import { Meta, StoryFn } from '@storybook/react';
import { withQuery } from '@storybook/addon-queryparams';

import Multi from './index';
import { TaskType } from '@/types/TaskType.enum';
import { QuestionMultiTask } from '@/types/Task';
import { Colour } from '@/types/Colour.enum';

const task: QuestionMultiTask = {
  ok: true,
  type: TaskType.Question_multi,
  image_url:
    'https://d3i6fh83elv35t.cloudfront.net/newshour/app/uploads/2016/07/apollogiftweet1.gif',
  content:
    'What number was the <strong>Apollo mission</strong> that successfully put a man on the moon for the first time in <strong>human history</strong>?',
  hint: 'The answer is between 11 and 14',
  required: true,
  options: [
    {
      content: 'Apollo 11',
      colour: Colour.Blue
    },
    {
      content: 'Apollo 12',
      colour: Colour.Yellow
    },
    {
      content: 'Apollo 13',
      colour: Colour.Purple
    },
    {
      content: 'Apollo 14',
      colour: Colour.Red
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
