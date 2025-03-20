import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Player } from "../types";
import moment from "moment";

const LOCAL_STORAGE_KEY_PLAYER = "playersData";
const LAST_PLAYER_ID_KEY = "lastedPlayerID";

// let lastedPlayerID = 0;

type PlayerContextType = {
  players: Player[];
  addPlayer: (name: string, rank: string) => void;
  findIDOfPlayer: (name: string) => void;
  addExistedPlayer: (name: string) => void;
  updatePlayer: (name: string, updates: Partial<Player>) => void;
  updatePlayerByID: (id: number, updates: Partial<Player>) => void;
  clearPlayer: () => void;
  getPlayerNameByID: (id: number) => string
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);
export const usePlayerContext = () => useContext(PlayerContext)!;
export default function PlayerProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(() => {
    const savedPlayers = localStorage.getItem(LOCAL_STORAGE_KEY_PLAYER);

    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  const [lastedPlayerID, setLastedPlayerID] = useState<number>(() => {
    const savedID = localStorage.getItem(LAST_PLAYER_ID_KEY);

    return savedID ? JSON.parse(savedID) : 0;
  });

  // Save players and lastedPlayerID to localStorage whenever they change

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PLAYER, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(LAST_PLAYER_ID_KEY, JSON.stringify(lastedPlayerID));
  }, [lastedPlayerID]);

  const addPlayer = (name: string, rank: string) => {
    if (name !== "" && !players.some((player) => player.name === name)) {
      const newPlayer: Player = {
        name,
        status: "come",
        isPaid: false,
        history: [],
        rank,
        id: lastedPlayerID + 1,
        waitingSince: moment.now(),
        comeTime: moment.now(),
        goHomeTime: null,
      };

      setPlayers([...players, newPlayer]);
      setLastedPlayerID(lastedPlayerID + 1);
    } else {
      alert("Player name must be unique.");
    }
  };

  const findIDOfPlayer = (name: string): [boolean, number] => {
    const player = players.find((player) => player.name === name);
    if (player) {
      return [true, player.id];
    } else {
      return [false, 0];
    }
  };

  const addExistedPlayer = (name: string) => {
    const [found, playerID] = findIDOfPlayer(name);
    if (found) {
      updatePlayerByID(playerID, { status: "come" });
    } else {
      console.log("Player not found.");
    }
  };
  
  const getPlayerNameByID = (id: number): string => {
    const player = players.find((player) => player.id === id);
    if (player) {
      return player.name;
    } else {
      return "";
    }
  }

  const updatePlayer = (name: string, updates: Partial<Player>) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => (p.name === name ? { ...p, ...updates } : p))
    );
  };

  const updatePlayerByID = (id: number, updates: Partial<Player>) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };
  
  const clearPlayer = () => {
    setPlayers([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PLAYER);
    localStorage.removeItem(LAST_PLAYER_ID_KEY);
  };

  return (
    <PlayerContext.Provider
      value={{
        players,
        addPlayer,
        updatePlayer,
        addExistedPlayer,
        findIDOfPlayer,
        updatePlayerByID,
        clearPlayer,
        getPlayerNameByID
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
