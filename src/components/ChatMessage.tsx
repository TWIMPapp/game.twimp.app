import { MessageItem } from '@/types/MessageItem';

const ChatMessage = ({ message }: { message: MessageItem }) => {
  const { text, id, avatar, createdAt, sent } = message;

  return (
    <>
      <div className={`message ${sent ? 'sent' : 'received'}`}>
        {/* <img src={avatar} /> */}
        <p className="no-avatar">{text}</p>
      </div>
    </>
  );
};

export default ChatMessage;
