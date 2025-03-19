import { useState } from "react";
import { Button, Typography, Box, TextField } from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import { Court, Player } from "../types";
import { useHistoryContext } from "../providers/history-provider";
import moment from "moment";
import { flushSync } from "react-dom";

export default function MatchSection() {
  const { players, updatePlayer, updatePlayerByID } = usePlayerContext();
  const { courts, setCourts } = useCourtContext();
  const { addShuttle } = useShuttleContext();
  const { recordHistory } = useHistoryContext();
  const [leftSidePlayers, setLeftSidePlayers] = useState<Player[]>([]);
  const [rightSidePlayers, setRightSidePlayers] = useState<Player[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [shuttleNumber, setShuttleNumber] = useState("");

  const startMatch = () => {
    if (
      leftSidePlayers.length !== 2 ||
      rightSidePlayers.length !== 2 ||
      selectedCourt === "" ||
      !shuttleNumber
    ) {
      console.log(
        leftSidePlayers,
        rightSidePlayers,
        selectedCourt,
        shuttleNumber
      );
      alert("Select 2 players per side, a court, and enter a shuttle number.");
      return;
    }

    const addShuttleSuccess = addShuttle(Number(shuttleNumber));
    if (!addShuttleSuccess) {
      return;
    }

    setCourts(
      courts.map((court) =>
        court.name === selectedCourt
          ? {
              ...court,
              status: "using",
              currentMatch: {
                leftSidePlayersID: leftSidePlayers.map((p) => p.id),
                rightSidePlayersID: rightSidePlayers.map((p) => p.id),
                startedTime: Date.now(),
                ShuttleNumber: [Number(shuttleNumber)],
                endedTime: null,
                WinnerPlayersID: [],
                LoserPlayersID: [],
                SetResult: false,
              },
            }
          : court
      )
    );

    [...leftSidePlayers, ...rightSidePlayers].forEach((player) =>
      updatePlayer(player.name, { status: "playing" })
    );

    setLeftSidePlayers([]);
    setRightSidePlayers([]);
    setSelectedCourt("");
    setShuttleNumber("");
  };

  const handleRandomSelectPlayers = () => {
    const availablePlayers = players.filter(
      (player) => player.status === "come"
    );
    if (availablePlayers.length < 4) {
      alert("Must have at least 4 available players.");
      return;
    }

    flushSync(() => {
      setLeftSidePlayers([]);
      setRightSidePlayers([]);
    });

    const randomedPlayers = randoSequence(availablePlayers);
    console.log(randomedPlayers);
    handlePlayerSelection(randomedPlayers[0].value, "left");
    handlePlayerSelection(randomedPlayers[1].value, "left");
    handlePlayerSelection(randomedPlayers[2].value, "right");
    handlePlayerSelection(randomedPlayers[3].value, "right");
  };

  const handlePlayerSelection = (player: Player, side: "left" | "right") => {
    if (leftSidePlayers.includes(player) || rightSidePlayers.includes(player)) {
      if (side === "left") {
        setLeftSidePlayers((prev) => prev.filter((p) => p.id !== player.id));
      } else {
        setRightSidePlayers((prev) => prev.filter((p) => p.id !== player.id));
      }
    } else {
      if (side === "left" && leftSidePlayers.length < 2) {
        setLeftSidePlayers((prev) => {
          console.log("prev" + prev);
          return [...prev, player];
        });
      } else if (side === "right" && rightSidePlayers.length < 2) {
        setRightSidePlayers((prev) => [...prev, player]);
      }
    }
  };

  const handleEndMatch = (currentCourt: Court) => {
    if (!currentCourt.currentMatch) {
      return;
    }
    // free players
    const playerIds = [
      ...currentCourt.currentMatch.leftSidePlayersID,
      ...currentCourt.currentMatch.rightSidePlayersID,
    ];
    playerIds.forEach((playerId) =>
      updatePlayerByID(playerId, { status: "come", waitingSince: moment.now() })
    );

    // free court
    setCourts(
      courts.map((court) =>
        court.name === currentCourt.name
          ? {
              ...court,
              status: "available",
              matchCount: currentCourt.matchCount + 1,
            }
          : court
      )
    );

    // save history to history list and each player history
    recordHistory(currentCourt.currentMatch);
    playerIds.forEach((playerId) => {
      const currentPlayer = players.find((p) => p.id === playerId);
      if (!currentPlayer?.history) {
        return
      }
      if (!currentCourt.currentMatch) {
        return
      }
      updatePlayerByID(playerId, { history: [...currentPlayer.history, currentCourt.currentMatch] })
    }
    );
  };

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5">Match Management</Typography>
      <Box sx={{ m: 2 }}>
        <Typography>Ongoing Matches</Typography>
        {courts
          .filter((court) => court.status === "using" && court.currentMatch)
          .map((court, index) => (
            <Box
              key={index}
              sx={{ border: "1px solid", padding: 2, margin: 1 }}
            >
              <Typography>Court: {court.name}</Typography>
              <Typography>
                Left Side Players:{" "}
                {court.currentMatch?.leftSidePlayersID
                  .map((id) => players.find((p) => p.id === id)?.name)
                  .join(", ")}
              </Typography>
              <Typography>
                Right Side Players:{" "}
                {court.currentMatch?.rightSidePlayersID
                  .map((id) => players.find((p) => p.id === id)?.name)
                  .join(", ")}
              </Typography>
              <Typography>
                Time Since Start:{" "}
                {court.currentMatch?.startedTime
                  ? `${Math.floor(
                      (Date.now() - court.currentMatch.startedTime) / 60000
                    )} mins`
                  : "N/A"}
              </Typography>
              <Typography>
                Shuttle Number: {court.currentMatch?.ShuttleNumber.join(", ")}
              </Typography>
              <Button onClick={() => handleEndMatch(court)}>End match</Button>
            </Box>
          ))}
      </Box>
      <Box>
        <Typography>Select Court</Typography>
        {courts
          .filter((p) => p.status === "available")
          .map((c) => (
            <Button
              key={c.name}
              variant="outlined"
              onClick={() => setSelectedCourt(c.name)}
            >
              {c.name} {selectedCourt === c.name ? "✔" : ""}
            </Button>
          ))}
      </Box>
      <Box>
        <Typography>Select Left Side Players (2 required)</Typography>
        {players
          .filter((p) => p.status === "come")
          .map((player) => (
            <Button
              key={player.id}
              variant="outlined"
              onClick={() => handlePlayerSelection(player, "left")}
            >
              {player.name} {leftSidePlayers.includes(player) ? "✔" : ""}
            </Button>
          ))}
      </Box>
      <Box>
        <Typography>Select Right Side Players (2 required)</Typography>
        {players
          .filter((p) => p.status === "come")
          .map((player) => (
            <Button
              key={player.id}
              variant="outlined"
              onClick={() => handlePlayerSelection(player, "right")}
            >
              {player.name} {rightSidePlayers.includes(player) ? "✔" : ""}
            </Button>
          ))}
      </Box>

      <TextField
        sx={{ m: 2 }}
        label="Shuttle Number"
        value={shuttleNumber}
        onChange={(e) => setShuttleNumber(e.target.value)}
      />
      <Button
        sx={{ m: 2 }}
        variant="contained"
        color="primary"
        onClick={handleRandomSelectPlayers}
      >
        Random
      </Button>
      <Button sx={{ m: 2 }} variant="contained" color="primary" onClick={startMatch}>
        Start Match
      </Button>
    </Box>
  );
}
