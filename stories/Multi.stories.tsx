import React from 'react';
import { StoryFn } from '@storybook/react';
import { QuestionMultiTask } from '../src/typings/Task';
import Multi from '../src/pages/task/multi';
import { TaskType } from '../src/typings/TaskType.enum';
import { Colour } from '../src/typings/Colour.enum';

const task: QuestionMultiTask = {
  ok: true,
  id: 1,
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
      colour: Colour.Green
    },
    {
      content: 'Apollo 13',
      colour: Colour.Yellow
    },
    {
      content: 'Apollo 14',
      colour: Colour.Red
    }
  ]
};

export default {
  title: 'Tasks/Question Multi',
  component: Multi
};

const MultiTemplateLight: StoryFn<typeof Multi> = (args) => {
  document.documentElement.classList.remove('dark');
  return <Multi testTask={task}></Multi>;
};
const MultiTemplateDark: StoryFn<typeof Multi> = (args) => {
  document.documentElement.classList.add('dark');
  return <Multi testTask={task}></Multi>;
};

export const LightState = MultiTemplateLight.bind({});
export const DarkState = MultiTemplateDark.bind({});
