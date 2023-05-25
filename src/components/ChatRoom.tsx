import { createRef, useEffect, useRef, useState } from 'react';
import { MessageItem } from '@/types/MessageItem';
import ChatMessage from './ChatMessage';
import { CircularProgress } from '@mui/material';

const tauntingMessagePrompt = (): string => {
  const taunts = [
    `Ask something good...`,
    `Do you even care?`,
    `Keep guessing...`,
    `Try harder...`,
    `You're not even close.`,
    `Come on, or... slow death.`,
    `Life is in your hands...`,
    `You're wasting your time.`
  ];

  return taunts[Math.floor(Math.random() * taunts.length)];
};

const ChatRoom = ({
  messages,
  sending,
  callback
}: {
  messages: MessageItem[];
  sending: boolean;
  callback: (answer: string) => any;
}) => {
  const [formValue, setFormValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    (messagesEndRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    setFormValue('');
    callback(formValue);
  };

  return (
    <>
      <main id="chat">
        {messages && messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </main>

      <form id="chatform" onSubmit={sendMessage}>
        <input
          value={formValue}
          disabled={sending}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={messages.length > 0 ? tauntingMessagePrompt() : 'Ask him something...'}
        />

        <button type="submit" disabled={!formValue || sending}>
          {sending ? <CircularProgress color="inherit" /> : '💀'}
        </button>
      </form>
    </>
  );
};

export default ChatRoom;
