import { MessageItem } from '@/types/MessageItem';

const ChatMessage = ({ message }: { message: MessageItem }) => {
  const { text, id, avatar, createdAt, sent } = message;

  return (
    <>
      <div className={`message ${sent ? 'sent' : 'received'}`}>
        {/* TODO: Set default image of user */}
        <img src={avatar || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
        <p>{text}</p>
      </div>
    </>
  );
};

export default ChatMessage;
