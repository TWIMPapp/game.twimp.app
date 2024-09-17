import React from 'react';
import { StoryFn } from '@storybook/react';

import Single from '../src/pages/task/single';
import { withQuery } from '@storybook/addon-queryparams';
import { QuestionSingleTask } from '../src/typings/Task';
import { TaskType } from '../src/typings/TaskType.enum';

const task: QuestionSingleTask = {
  ok: true,
  id: 1,
  type: TaskType.Question_single,
  image_url:
    'https://d3i6fh83elv35t.cloudfront.net/newshour/app/uploads/2016/07/apollogiftweet1.gif',
  content:
    'What number was the <strong>Apollo mission</strong> that successfully put a man on the moon for the first time in <strong>human history</strong>?',
  hint: 'The answer is between 11 and 14',
  required: true
};

export default {
  title: 'Tasks/Question Single',
  component: Single
};

const SingleTemplateLight: StoryFn<typeof Single> = (args) => {
  document.documentElement.classList.remove('dark');
  return <Single testTask={task}></Single>;
};

const SingleTemplateDark: StoryFn<typeof Single> = (args) => {
  document.documentElement.classList.add('dark');
  return <Single testTask={task}></Single>;
};

export const LightState = SingleTemplateLight.bind({});
export const DarkState = SingleTemplateDark.bind({});
