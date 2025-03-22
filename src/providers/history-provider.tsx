import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { MatchHistory } from "../types";
import moment from "moment";

const LOCAL_STORAGE_KEY_HISTORY = "matchHistories2";

type HistoryContextType = {
  histories: MatchHistory[];
  recordHistory: (history: MatchHistory) => void;
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const useHistoryContext = () => useContext(HistoryContext)!;

export default function HistoryProvider({ children }: { children: ReactNode }) {
  const [histories, setHistories] = useState<MatchHistory[]>(() => {
    const savedHistories = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
    return savedHistories ? JSON.parse(savedHistories) : [];
  });

  // Save histories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(histories));
  }, [histories]);

  const recordHistory = (history: MatchHistory) => {
    const updatedHistories = [
      ...histories,
      { ...history, endedTime: moment.now() },
    ];
    setHistories(updatedHistories);
  };

  return (
    <HistoryContext.Provider
      value={{
        histories,
        recordHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}
