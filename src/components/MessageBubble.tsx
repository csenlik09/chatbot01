import type { Message } from '@/lib/types';
import styles from './MessageBubble.module.css';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.assistant}`}>
      {message.image && (
        <img
          src={message.image}
          alt="Attached image"
          className={styles.messageImage}
        />
      )}
      {message.content && (
        <div className={styles.content}>{message.content}</div>
      )}
    </div>
  );
}
