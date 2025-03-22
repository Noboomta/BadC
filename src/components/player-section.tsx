import { useState } from "react";
import {
  Button,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

import { usePlayerContext } from "../providers/player-provider";

import PlayerRow from "./player-row";

export default function PlayerSection() {
  const { players, addPlayer } = usePlayerContext();
  const [playerName, setPlayerName] = useState("");
  const [playerRank, setPlayerRank] = useState("");

  const rankOptions = ["bg", "bg+", "n-", "n", "n+", "s", "s+", "unknow"];

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5">Players</Typography>
      <TextField
        id="filled-hidden-label-normal"
        required
        label="Player Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <FormControl sx={{ minWidth: 120, ml: 1 }}>
        <InputLabel id="player-rank-label">Rank</InputLabel>
        <Select
          labelId="player-rank-label"
          id="player-rank-select"
          size="small"
          value={playerRank}
          label="Rank"
          onChange={(e) => setPlayerRank(e.target.value)}
        >
          {rankOptions.map((rank) => (
            <MenuItem key={rank} value={rank}>
              {rank}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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

      {/* Use a single PlayerRow with all players */}
      <PlayerRow players={players} />
    </Box>
  );
}
