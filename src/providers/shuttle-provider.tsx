import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

type Shuttle = {
  number: number;
};
type ShuttleContextType = {
  shuttles: Shuttle[];
  addShuttle: (number: number) => boolean;
  clearShuttles: () => void;
};

const LOCAL_STORAGE_KEY_SHUTTLES = "shuttlesData5";

const ShuttleContext = createContext<ShuttleContextType | undefined>(undefined);
export const useShuttleContext = () => useContext(ShuttleContext)!;

export default function ShuttleProvider({ children }: { children: ReactNode }) {
  const [shuttles, setShuttles] = useState<Shuttle[]>(() => {
    const savedShuttles = localStorage.getItem(LOCAL_STORAGE_KEY_SHUTTLES);
    return savedShuttles ? JSON.parse(savedShuttles) : [];
  });

  // Save shuttles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SHUTTLES, JSON.stringify(shuttles));
  }, [shuttles]);
  const addShuttle = (number: number) => {
    if (!shuttles.some((shuttle) => shuttle.number === number)) {
      setShuttles([
        ...shuttles,
        {
          number: number,
        },
      ]);
      return true;
    } else {
      alert("Shuttle number must be unique.");
      return false;
    }
  };

  const clearShuttles = () => {
    setShuttles([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SHUTTLES);
  };

  return (
    <ShuttleContext.Provider value={{ shuttles, addShuttle, clearShuttles }}>
      {children}
    </ShuttleContext.Provider>
  );
}
