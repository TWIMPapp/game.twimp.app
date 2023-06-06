import { useEffect, useRef, useState } from 'react';
import { MessageItem } from '@/types/MessageItem';
import ChatMessage from './ChatMessage';
import { CircularProgress, Icon, LinearProgress } from '@mui/material';
import { Theme } from '@/types/theme.enum';
import { BatteryAlert, Bolt } from '@mui/icons-material';

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

const ChatRoom = ({
  messages,
  sending,
  energy,
  theme,
  callback
}: {
  messages: MessageItem[];
  sending: boolean;
  energy: number;
  theme?: Theme;
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
        <div className="energy">
          <LinearProgress className="energy__progress" variant="determinate" value={energy} />
          {theme === Theme.HORROR ? (
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
            messages.length > 1 && theme === Theme.HORROR
              ? tauntingMessagePrompt()
              : 'Ask something...'
          }
        />

        <button type="submit" disabled={!formValue || sending}>
          {sending ? <CircularProgress color="inherit" /> : theme === Theme.HORROR ? '💀' : '💬'}
        </button>
      </form>
    </>
  );
};

export default ChatRoom;
