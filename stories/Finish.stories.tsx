import React from 'react';
import { StoryFn } from '@storybook/react';

import Finish from '../src/pages/task/finish';
import { withQuery } from '@storybook/addon-queryparams';

const task = {
  ok: true,
  type: 'information',
  image_url:
    'https://media2.giphy.com/media/l41lPZpU2FncYBeH6/giphy.gif?cid=ecf05e47cxwmbshoe7m5z1eocmxzu8htrv7o7fsu3r260vzb&ep=v1_gifs_search&rid=giphy.gif&ct=g',
  content: `## Every good thing must come to an end ;(

It's been a blast. Click the button below to finish the game. And we'll see you next time!
  `
};

export default {
  title: 'Tasks/Finish',
  component: Finish,
  decorators: [withQuery],
  parameters: {
    query: {
      task: JSON.stringify(task)
    }
  }
};

const InfoTemplate: StoryFn<typeof Finish> = (args) => {
  return <Finish></Finish>;
};

export const DefaultState = InfoTemplate.bind({});
