import { useEffect, useRef, useState } from 'react';
import { MessageItem } from '../types/MessageItem';
import ChatMessage from './ChatMessage';
import { CircularProgress, LinearProgress } from '@mui/material';
import { Theme } from '../types/Theme.enum';
import { BatteryAlert, Bolt } from '@mui/icons-material';

// TODO: [BE] Messages should return with id

// TODO: [FE] Get all messages on initial load (sent and received based on role)

const tauntingMessagePrompt = (): string => {
  const taunts = [
    `Ask something good...`,
    `Keep guessing...`,
    `Try harder...`,
    `You're not even close...`,
    `Life is in your hands...`,
    `You're wasting your time...`
  ];

  return taunts[Math.floor(Math.random() * taunts.length)];
};

const typingMsg: MessageItem = {
  id: '999',
  text: '...',
  role: 'assistant',
  createdAt: new Date(),
  avatar: 'https://trail-images.s3.eu-west-2.amazonaws.com/ryan/ryan.png',
  sent: false,
  name: ''
};

const ChatRoom = ({
  messages,
  sending,
  energy,
  isTyping,
  theme,
  upsideDown,
  callback
}: {
  messages: MessageItem[];
  sending: boolean;
  energy: number;
  isTyping: boolean;
  theme?: Theme;
  upsideDown?: boolean;
  callback: (answer: string) => any;
}) => {
  const [formValue, setFormValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    (messagesEndRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    setFormValue('');
    callback(formValue);
  };

  return (
    <>
      <div className="chat-header">
        <img className="chat-header__avatar" src={messages[0].avatar} />
        <h1 className="chat-header__name">{messages[0].name}</h1>
      </div>
      <main id="chat" className={upsideDown ? 'upside-down' : ''}>
        {messages && messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        {isTyping && <ChatMessage key={999} message={typingMsg} />}
        <div ref={messagesEndRef} />
      </main>

      <form id="chatform" className={upsideDown ? 'upside-down' : ''} onSubmit={sendMessage}>
        <div className="energy">
          <LinearProgress className="energy__progress" variant="determinate" value={energy} />
          {theme === Theme.Horror ? (
            <BatteryAlert className="energy__icon" color="primary" />
          ) : (
            <Bolt className="energy__icon" color="primary" />
          )}
          <span className="energy__percent">{energy}%</span>
        </div>
        <input
          value={formValue}
          disabled={sending}
          onChange={(e) => setFormValue(e.target.value)}
          maxLength={100}
          placeholder={
            messages.length > 1 && theme === Theme.Horror
              ? tauntingMessagePrompt()
              : 'Ask something...'
          }
        />

        <button type="submit" disabled={!formValue || sending}>
          {sending ? <CircularProgress color="inherit" /> : theme === Theme.Horror ? '💀' : '💬'}
        </button>
      </form>
    </>
  );
};

export default ChatRoom;
