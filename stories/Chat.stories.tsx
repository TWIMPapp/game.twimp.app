import React from 'react';
import { StoryFn } from '@storybook/react';

import Chat from '../src/pages/task/chat';

export default {
  title: 'Tasks/Chat',
  component: Chat
};

const ChatTemplate: StoryFn<typeof Chat> = (args) => {
  return <Chat></Chat>;
};

export const DefaultState = ChatTemplate.bind({});
