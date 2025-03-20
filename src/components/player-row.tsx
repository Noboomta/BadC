import { Box, Button, Typography } from "@mui/material";
import moment from "moment";
import { statusColors } from "../constant";
import { Player } from "../types";
import { usePlayerContext } from "../providers/player-provider";
import { useEffect, useState } from "react";

export default function PlayerRow({ players }: { players: Player[] }) {
  const { updatePlayer } = usePlayerContext();

  const [currentTime, setCurrentTime] = useState(moment.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCome = (player: Player) => {
    updatePlayer(player.name, {
      status: "come",
      waitingSince: moment.now(),
    });
  };
  const handlePause = (player: Player) => {
    updatePlayer(player.name, { status: "pause" });
  };
  const handleGoHome = (player: Player) => {
    updatePlayer(player.name, {
      status: "go home",
      goHomeTime: moment.now(),
    });
  };
  const handlePaid = (player: Player) => {
    if (player.isPaid) {
        if (confirm("Player UnPaid?")) {
            updatePlayer(player.name, { isPaid: !player.isPaid, status: "come" });
        }
    } 
    if (!player.isPaid) {
        if (confirm("Player Paid?")) {
            updatePlayer(player.name, { isPaid: !player.isPaid, status: "go home" });
        }
    } 
  };
  
  const shuttleCount = (player: Player) => {
    return player.history.reduce((count, match) => {
      if (
        match.leftSidePlayersID.includes(player.id) ||
        match.rightSidePlayersID.includes(player.id)
      ) {
        return count + match.ShuttleNumber.length;
      }
      return count;
    }, 0);
  };

  const isReadOnly = (player: Player) => {
    return player.status === "playing";
  };

  return players
    .sort((a, b) => a.waitingSince - b.waitingSince)
    .map((player, index) => (
      <Box
        key={index}
        sx={{
          backgroundColor: statusColors[player.status],
          padding: 0.5,
          margin: 0.5,
        }}
      >
        <Typography fontSize={16}>[{player.id}] {player.name}-{player.rank} [{player.status}] | Matchs: {player.history.length} Use: {shuttleCount(player)} | {" "}
        {player.status === "come"
          ? moment(currentTime).subtract(player.waitingSince).format("mm:ss")
          : ""}{" "}
        </Typography>
        
        {!isReadOnly(player) ? (
          <>
            <Button size="small" onClick={() => handleCome(player)}>Come</Button>
            <Button size="small" onClick={() => handlePause(player)}>
              Pause
            </Button>
            <Button size="small" onClick={() => handleGoHome(player)}>Home</Button>
            <Button size="small" onClick={() => handlePaid(player)}>
              {player.isPaid ? "Paid" : "Not Paid"}
            </Button>
          </>
        ) : null}
      </Box>
    ));
}
