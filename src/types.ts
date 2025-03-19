export type MatchHistory = {
  leftSidePlayersID: number[];
  rightSidePlayersID: number[];
  startedTime: number | null;
  endedTime: number | null;
  WinnerPlayersID: number[];
  LoserPlayersID: number[];
  SetResult: boolean;
  ShuttleNumber: number[];
};

export type Player = {
  id: number;
  name: string;
  status: string;
  waitingSince: number;
  comeTime: number | null;
  goHomeTime: number | null;
  rank: string;
  isPaid: boolean;
  history: MatchHistory[];
};

export type CourtTime = {
  startTime: number | null;
  endTime: number | null;
  totalMinuite: number | null;
};

export type Court = {
  name: string;
  status: string;
  matchCount: number;
  courtUsages: CourtTime[];
  currentMatch: MatchHistory | null;
};