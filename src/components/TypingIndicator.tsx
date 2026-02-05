import styles from './TypingIndicator.module.css';

export default function TypingIndicator() {
  return (
    <div className={styles.container}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}
