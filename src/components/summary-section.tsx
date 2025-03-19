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
} from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import { useHistoryContext } from "../providers/history-provider";
import moment from "moment";

export default function SummarySection() {
  const { players } = usePlayerContext();
  const { courts } = useCourtContext();
  const { shuttles } = useShuttleContext();
  const { histories } = useHistoryContext();

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
      <Typography variant="h5">Summary</Typography>
      <Box>
        <Typography variant="h6">Players Stats</Typography>
        {Object.entries(playerStatusCount).map(([status, count]) => (
          <Typography key={status}>
            {status}: {count}
          </Typography>
        ))}
      </Box>
      <Box>
        <Typography variant="h6">Court Stats</Typography>
        {Object.entries(courtStatusCount).map(([status, count]) => (
          <Typography key={status}>
            {status}: {count}
          </Typography>
        ))}
      </Box>
      <Box>
        <Typography>Shuttles Used: {shuttles.length}</Typography>
      </Box>
      <Typography variant="h6">Match History</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 250 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Start at</TableCell>
              <TableCell>End at</TableCell>
              <TableCell>Left</TableCell>
              <TableCell>Right</TableCell>
              <TableCell>Shuttle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {histories.map((row) => (
              <TableRow
                key={row.startedTime}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {moment(row.startedTime).format("mm:ss")}
                </TableCell>
                <TableCell>
                  {moment(row.endedTime).format("mm:ss")}
                </TableCell>
                <TableCell>
                  {row.leftSidePlayersID.join(", ")}
                </TableCell>
                <TableCell>
                  {row.rightSidePlayersID.join(", ")}
                </TableCell>
                <TableCell>{row.ShuttleNumber}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
