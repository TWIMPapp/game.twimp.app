import { Message } from '@/typings/Task';

const ChatMessage = ({ message }: { message: Message }) => {
  const { content, id, created, role } = message;
  const sent = role === 'user';

  return (
    <>
      <div className={`message ${sent ? 'sent' : 'received'}`}>
        <p className="no-avatar">{content}</p>
      </div>
    </>
  );
};

export default ChatMessage;
