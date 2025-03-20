import { useState } from "react";
import { Button, Typography, Box, TextField, Stack } from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import { Court, MatchHistory, Player } from "../types";
import { useHistoryContext } from "../providers/history-provider";
// import * as dayjs from 'dayjs'
import { flushSync } from "react-dom";

export default function MatchSection() {
  const { players, updatePlayer, updatePlayerByID } = usePlayerContext();
  const { courts, setCourts } = useCourtContext();
  const { shuttles } = useShuttleContext();
  const { addShuttle } = useShuttleContext();
  const { recordHistory } = useHistoryContext();
  const [leftSidePlayers, setLeftSidePlayers] = useState<Player[]>([]);
  const [rightSidePlayers, setRightSidePlayers] = useState<Player[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [shuttleNumber, setShuttleNumber] = useState(0);
  const [additionalShuttleNumber, setAdditionalShuttleNumber] = useState(0);

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
      alert("Select 2 players per side, a court, and enter valid shuttle number.");
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
    setShuttleNumber(0);
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

    // @ts-expect-error randoSequence is defined in rando.js
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
  
  const handleAddShuttle = (currentCourt: Court) => {
    console.log("addi: ", additionalShuttleNumber)
    console.log("shuttles: ", shuttles.join(","))
    
    if (!currentCourt.currentMatch || currentCourt.status !== "using" || additionalShuttleNumber <= 0) { 
      alert("Invalid shuttle number");
      setAdditionalShuttleNumber(0);
      return;
    }
  
    const addShuttleSuccess = addShuttle(Number(additionalShuttleNumber));
    if (!addShuttleSuccess) {
      setAdditionalShuttleNumber(0);
      return;
    }
    
    // Ensure currentMatch is fully structured when updating
    setCourts(
      courts.map((court) =>
        court.name === currentCourt.name
          ? {
              ...court,
              currentMatch: {
                ...currentCourt.currentMatch, // Ensure full structure
                ShuttleNumber: [...(currentCourt.currentMatch?.ShuttleNumber || []), additionalShuttleNumber],
              } as MatchHistory, // Explicitly cast to MatchHistory to satisfy TypeScript
            }
          : court
      )
    );
  
    // Reset the input field
    setAdditionalShuttleNumber(0);
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
      updatePlayerByID(playerId, { status: "come", waitingSince: Date.now() })
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
    });
    
    // free court
    setCourts(
      courts.map((court) =>
        court.name === currentCourt.name
          ? {
            ...court,
            status: "available",
            matchCount: currentCourt.matchCount + 1,
              currentMatch: null,
            }
          : court
      )
    );
  };

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5">Match Management</Typography>
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Ongoing Matches</Typography>
        {courts
          .filter((court) => court.status === "using" && court.currentMatch)
          .sort((a, b) => {
            return a.name > b.name ? 1 : -1
          })
          .map((court, index) => (
            <Box
              key={index}
              sx={{ border: "1px solid", padding: 1, margin: 0.5 }}
            >
              <Typography>[ Court: {court.name} ] - [ Time:{" "}
                {court.currentMatch?.startedTime
                  ? `${Math.floor(
                      (Date.now() - court.currentMatch.startedTime) / 60000
                    )} mins ]`
                  : "N/A ]"}</Typography>
              <Typography>
                {"[ "}
                {court.currentMatch?.leftSidePlayersID
                  .map((id) => players.find((p) => p.id === id)?.name)
                  .join(", ")}
                {" ]"} Vs
                {" [ "}
                {court.currentMatch?.rightSidePlayersID
                  .map((id) => players.find((p) => p.id === id)?.name)
                  .join(", ")}{" ]"}
              </Typography>
              <Typography >
                Shuttles use: {court.currentMatch?.ShuttleNumber.join(", ")}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={1}>
                <TextField
                  variant="filled"
                  defaultValue={0}
                  margin="dense"
                  type="number"
                  sx={{ m: 1 }}
                  size="small"
                  label="Shuttle Number"
                  value={additionalShuttleNumber}
                  fullWidth={false}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string to prevent issues with typing
                    if (value === "" || /^[0-9]+$/.test(value)) {
                      setAdditionalShuttleNumber(Number(value));
                    }
                    
                    console.log(courts)
                  }}
                  />
                  <Button onClick={() => handleAddShuttle(court)}>Add</Button>
                </Stack>
              </Box>
              <Button onClick={() => handleEndMatch(court)}>End match</Button>
            </Box>
          ))}
      </Box>
      
      <Box sx={{ my: 2 }}> 
      
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
          .sort((a,b) => a.id - b.id)
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
          .sort((a,b) => a.id - b.id)
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
        type="number"
        variant="filled"
        sx={{ m: 1 }}
        label="Shuttle Number"
        value={shuttleNumber}
        onChange={(e) => {
          const value = e.target.value;
          // Allow empty string to prevent issues with typing
          if (value === "" || /^[0-9]+$/.test(value)) {
            setShuttleNumber(Number(value));
          }
        }}
      />
      
      </Box>
      
      <Box>
        <Typography>Shuttles Used List: {shuttles.map((s) => s.number).join(", ")}</Typography>
      </Box>
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
