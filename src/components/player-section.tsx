import { useState } from "react";
import { Button, Typography, Box, TextField } from "@mui/material";

import { usePlayerContext } from "../providers/player-provider";

import PlayerRow from "./player-row";

export default function PlayerSection() {
  const { players, addPlayer } = usePlayerContext();
  const [playerName, setPlayerName] = useState("");
  const [playerRank, setPlayerRank] = useState("");

  return (
    <Box sx={{ p: 0}}>
      <Typography variant="h5">Players</Typography>
      <TextField
        label="Player Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <TextField
        size="small"
        label="Player Rank"
        value={playerRank}
        onChange={(e) => setPlayerRank(e.target.value)}
      />
      <Button
        sx={{ m: 2 }}
        variant="contained"
        onClick={() => {
          addPlayer(playerName, playerRank);
          setPlayerName("");
          setPlayerRank("");
        }}
      >
        Add Player
      </Button>
      <PlayerRow
        players={players.filter((player) => player.status === "come")}
      />
      <PlayerRow
        players={players.filter((player) => player.status === "playing")}
      />
      <PlayerRow
        players={players.filter((player) => player.status === "pause")}
      />
      <PlayerRow
        players={players.filter((player) => player.status === "go home")}
      />
      <PlayerRow
        players={players.filter((player) => player.status === "offline")}
      />
    </Box>
  );
}
