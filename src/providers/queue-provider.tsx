import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { Player } from "../types";

// Interface for queued match
interface QueuedMatch {
  id: number;
  leftSidePlayers: Player[];
  rightSidePlayers: Player[];
  court?: string; // Make court optional
}

type QueueContextType = {
  matchQueue: QueuedMatch[];
  setMatchQueue: React.Dispatch<React.SetStateAction<QueuedMatch[]>>;
  queueIdCounter: number;
  setQueueIdCounter: React.Dispatch<React.SetStateAction<number>>;
  clearQueue: () => void;
};

const LOCAL_STORAGE_KEY_QUEUE = "queueData5";
const LOCAL_STORAGE_KEY_QUEUE_COUNTER = "queueCounter5";

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const useQueueContext = () => useContext(QueueContext)!;

export default function QueueProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage
  const [matchQueue, setMatchQueue] = useState<QueuedMatch[]>(() => {
    const savedQueue = localStorage.getItem(LOCAL_STORAGE_KEY_QUEUE);
    return savedQueue ? JSON.parse(savedQueue) : [];
  });

  const [queueIdCounter, setQueueIdCounter] = useState<number>(() => {
    const savedCounter = localStorage.getItem(LOCAL_STORAGE_KEY_QUEUE_COUNTER);
    return savedCounter ? parseInt(savedCounter) : 1;
  });

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_QUEUE, JSON.stringify(matchQueue));
  }, [matchQueue]);

  // Save counter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_QUEUE_COUNTER,
      queueIdCounter.toString()
    );
  }, [queueIdCounter]);

  const clearQueue = () => {
    setMatchQueue([]);
    setQueueIdCounter(1);
    localStorage.removeItem(LOCAL_STORAGE_KEY_QUEUE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_QUEUE_COUNTER);
  };

  return (
    <QueueContext.Provider
      value={{
        matchQueue,
        setMatchQueue,
        queueIdCounter,
        setQueueIdCounter,
        clearQueue,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}
