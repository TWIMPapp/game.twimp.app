import { StoryFn } from '@storybook/react';

import Multi from './index';
import { TaskType } from '@/types/TaskType.enum';
import { Task } from '@/types/Task';

const task: Task = {
  id: '1',
  type: TaskType.QUESTION_MULTI,
  title: 'Multi Question',
  description: 'This is a multi question',
  question: 'What is your favourite colour?',
  options: [
    {
      id: '1',
      text: 'Red'
    },
    {
      id: '2',
      text: 'Blue'
    },
    {
      id: '3',
      text: 'Green'
    },
    {
      id: '4',
      text: 'Yellow'
    }
  ]
};

export default {
  title: 'Tasks/Question Multi',
  component: Multi,
  args: task
};

const MultiTemplate: StoryFn<typeof Multi> = (args) => {
  return <Multi></Multi>;
};

export const DefaultState = MultiTemplate.bind({});
export const QuestionTrueFalse = MultiTemplate.bind({});
export const QuestionWithImage = MultiTemplate.bind({});
