import { StoryFn } from '@storybook/react';

import Chat from '../src/pages/t/chat';

export default {
  title: 'Tasks/Chat',
  component: Chat
};

const ChatTemplate: StoryFn<typeof Chat> = (args) => {
  return <Chat></Chat>;
};

export const DefaultState = ChatTemplate.bind({});
