import moment from "moment";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Court } from "../types";

const LOCAL_STORAGE_KEY_COURT = "courtsData";

type CourtContextType = {
  courts: Court[];
  setCourts: React.Dispatch<React.SetStateAction<Court[]>>;
  addCourt: (name: string) => void;
  pauseCourt: (name: string) => void;
};

const CourtContext = createContext<CourtContextType | undefined>(undefined);
export const useCourtContext = () => useContext(CourtContext)!;

export default function CourtProvider({ children }: { children: ReactNode }) {
  const [courts, setCourts] = useState<Court[]>(() => {
    const savedCourts = localStorage.getItem(LOCAL_STORAGE_KEY_COURT);
    return savedCourts ? JSON.parse(savedCourts) : [];
  });

   // Save courts to localStorage whenever they change
   useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_COURT, JSON.stringify(courts));
  }, [courts]);

  const addCourt = (name: string) => {
    if (!courts.some((court) => court.name === name)) {
      const newCourtTime = {
        startTime: moment.now(),
        endTime: null,
        totalMinuite: null,
      };
      setCourts([
        ...courts,
        {
          name,
          status: "available",
          matchCount: 0,
          courtUsages: [newCourtTime],
          currentMatch: null,
        },
      ]);
    } else {
      alert("Court name must be unique.");
    }
  };

  const pauseCourt = (name: string) => {
    const thisCourt = courts.find((court) => court.name === name);
    if (thisCourt?.status == "using") {
      thisCourt.courtUsages.slice(-1)[0].endTime = moment.now();
      thisCourt.courtUsages.slice(-1)[0].totalMinuite =
        (thisCourt.courtUsages.slice(-1)[0].endTime ?? 0) -
        (thisCourt.courtUsages.slice(-1)[0].startTime ?? 0);
      if (thisCourt.courtUsages.slice(-1)[0].totalMinuite ?? 0 < 0) {
        thisCourt.courtUsages.slice(-1)[0].totalMinuite = 0;
      }
      thisCourt.status = "pause";
    }
    setCourts(
      courts.map((court) =>
        court.name === name ? { ...court, status: "paused" } : court
      )
    );
  };

  return (
    <CourtContext.Provider value={{ courts, setCourts, addCourt, pauseCourt }}>
      {children}
    </CourtContext.Provider>
  );
}
