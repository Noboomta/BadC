import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Divider,
} from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import { useHistoryContext } from "../providers/history-provider";
import moment from "moment";
import { useState } from "react";

export default function SummarySection() {
  const { players, getPlayerNameByID } = usePlayerContext();
  const { courts } = useCourtContext();
  const { shuttles } = useShuttleContext();
  const { histories } = useHistoryContext();
  
  const [searchPlayer, setSearchPlayer] = useState("");
  
  const filteredHistories = histories.filter((h) => {
    if (searchPlayer.trim() === "") return true; 
    
    return (
      h.leftSidePlayersID.some((p) => getPlayerNameByID(p) === searchPlayer) ||
      h.rightSidePlayersID.some((p) => getPlayerNameByID(p) === searchPlayer)
    );
  });

  const playerStatusCount = players.reduce((acc, player) => {
    acc[player.status] = (acc[player.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const courtStatusCount = courts.reduce((acc, court) => {
    acc[court.status] = (acc[court.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box sx={{ my: 4 }}>
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Players Stats</Typography>
        {Object.entries(playerStatusCount).map(([status, count]) => (
          <Typography key={status}>
            {status}: {count}
          </Typography>
        ))}
        
        <Typography>
          paid: {players.filter((p) => p.isPaid).length}
        </Typography>
        <Typography>
          unPaid: {players.filter((p) => !p.isPaid).length}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Court Stats</Typography>
        {Object.entries(courtStatusCount).map(([status, count]) => (
          <Typography key={status}>
            {status}: {count}
          </Typography>
        ))}
      </Box>
      <Divider />
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">Match Stats</Typography>
        <Box>
          <Typography>Match Played: {histories.length}</Typography>
        </Box>
        <Box>
          <Typography>Shuttles Used: {shuttles.length}</Typography>
        </Box>
        <Box>
          <Typography>Shuttles Used List: {shuttles.map((s) => s.number).join(", ")}</Typography>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">All Match History</Typography>
        <TextField
          size="small"
          label="Search Player Name"
          value={searchPlayer}
          onChange={(e) => setSearchPlayer(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 250 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell padding="none">Start at</TableCell>
                <TableCell padding="none">End at</TableCell>
                <TableCell padding="none">Left</TableCell>
                <TableCell padding="none">Right</TableCell>
                <TableCell padding="none">Shuttle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistories.map((row) => (
                <TableRow
                  key={row.startedTime}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell padding="none" component="th" scope="row">
                    {moment(row.startedTime).format("HH:mm:ss")}
                  </TableCell>
                  <TableCell padding="none">
                    {moment(row.endedTime).format("HH:mm:ss")}
                  </TableCell>
                  <TableCell padding="none">
                    {row.leftSidePlayersID.map((p) => getPlayerNameByID(p)).join(", ")}
                  </TableCell>
                  <TableCell padding="none">
                  {row.rightSidePlayersID.map((p) => getPlayerNameByID(p)).join(", ")}
                  </TableCell>
                  <TableCell padding="none">{row.ShuttleNumber.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
