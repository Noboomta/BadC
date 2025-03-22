import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Container,
  Stack,
  InputAdornment,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import { useHistoryContext } from "../providers/history-provider";
import moment from "moment";
import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import SportsIcon from "@mui/icons-material/Sports";
import HistoryIcon from "@mui/icons-material/History";
import PaidIcon from "@mui/icons-material/Paid";
import ClearIcon from "@mui/icons-material/Clear";

export default function SummarySection() {
  const { players, getPlayerNameByID } = usePlayerContext();
  const { courts } = useCourtContext();
  const { shuttles } = useShuttleContext();
  const { histories } = useHistoryContext();

  const [searchPlayer, setSearchPlayer] = useState("");

  const filteredHistories = histories.filter((h) => {
    if (searchPlayer.trim() === "") return true;

    return (
      h.leftSidePlayersID.some((p) =>
        getPlayerNameByID(p)?.startsWith(searchPlayer)
      ) ||
      h.rightSidePlayersID.some((p) =>
        getPlayerNameByID(p)?.startsWith(searchPlayer)
      )
    );
  });

  // Get player status count
  const playerStatusCount = players.reduce((acc, player) => {
    acc[player.status] = (acc[player.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get court status count
  const courtStatusCount = courts.reduce((acc, court) => {
    acc[court.status] = (acc[court.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get payment stats
  const paidPlayers = players.filter((p) => p.isPaid).length;
  const unpaidPlayers = players.filter((p) => !p.isPaid).length;
  const paymentPercentage =
    players.length > 0 ? Math.round((paidPlayers / players.length) * 100) : 0;

  // Status color mapping
  const statusColors = {
    come: "#4caf50", // green
    playing: "#2196f3", // blue
    pause: "#ff9800", // orange
    "go home": "#f44336", // red
    offline: "#9e9e9e", // grey
    available: "#4caf50", // green
    using: "#2196f3", // blue
    maintenance: "#ff9800", // orange
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "#9e9e9e";
  };

  const clearSearch = () => {
    setSearchPlayer("");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight="medium"
        sx={{ mb: 3 }}
      >
        Session Summary
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Players Stats Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Players ({players.length})
                </Typography>
              </Box>

              <Stack spacing={1} sx={{ mb: 2 }}>
                {Object.entries(playerStatusCount).map(([status, count]) => (
                  <Box
                    key={status}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(status) + "20",
                        color: getStatusColor(status),
                        border: `1px solid ${getStatusColor(status)}`,
                        fontWeight: "medium",
                        minWidth: "80px",
                      }}
                    />
                    <Typography variant="body1">{count} players</Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PaidIcon
                      color="success"
                      sx={{ mr: 1, fontSize: "1rem" }}
                    />
                    <Typography variant="body2">Payment Status</Typography>
                  </Box>
                  <Typography variant="body2">
                    {paymentPercentage}% paid
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={paymentPercentage}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: "#f5f5f5",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#4caf50",
                    },
                  }}
                />
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Paid: {paidPlayers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unpaid: {unpaidPlayers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Courts Stats Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <SportsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Courts ({courts.length})
                </Typography>
              </Box>

              <Stack spacing={1}>
                {Object.entries(courtStatusCount).map(([status, count]) => (
                  <Box
                    key={status}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(status) + "20",
                        color: getStatusColor(status),
                        border: `1px solid ${getStatusColor(status)}`,
                        fontWeight: "medium",
                        minWidth: "80px",
                      }}
                    />
                    <Typography variant="body1">{count} courts</Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total matches played on all courts: {histories.length}
                </Typography>
                {courts.map((court) => (
                  <Typography
                    key={court.name}
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {court.name}: {court.matchCount} matches
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Match Stats Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Match Stats
                </Typography>
              </Box>

              <Stack spacing={1}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">Total Matches</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {histories.length}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">Shuttles Used</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {shuttles.length}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">
                    Average Shuttles per Match
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {histories.length > 0
                      ? (shuttles.length / histories.length).toFixed(1)
                      : "0"}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" sx={{ mb: 1 }}>
                Shuttle Numbers Used:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {shuttles.map((s, index) => (
                  <Chip
                    key={index}
                    label={s.number}
                    size="small"
                    variant="outlined"
                    sx={{ bgcolor: "#f5f5f5" }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Match History Section */}
      <Card elevation={1} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <HistoryIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Match History
            </Typography>
          </Box>

          <Box sx={{ display: "flex", mb: 3 }}>
            <TextField
              size="small"
              placeholder="Search by player name"
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ maxWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchPlayer && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={clearSearch}
                      edge="end"
                      aria-label="clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {filteredHistories.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No match history found.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }} size="medium">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f7fa" }}>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Left Side</TableCell>
                    <TableCell>Right Side</TableCell>
                    <TableCell>Shuttles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistories.map((row) => {
                    const duration = moment.duration(
                      moment(row.endedTime).diff(moment(row.startedTime))
                    );
                    const minutes = duration.minutes();
                    const seconds = duration.seconds();

                    return (
                      <TableRow
                        key={row.startedTime}
                        sx={{
                          "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell>
                          {moment(row.startedTime).format("HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          {moment(row.endedTime).format("HH:mm:ss")}
                        </TableCell>
                        <TableCell>{`${minutes}m ${seconds}s`}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {row.leftSidePlayersID.map((p) => (
                              <Chip
                                key={p}
                                label={getPlayerNameByID(p)}
                                size="small"
                                variant="outlined"
                                sx={{ m: 0.1 }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {row.rightSidePlayersID.map((p) => (
                              <Chip
                                key={p}
                                label={getPlayerNameByID(p)}
                                size="small"
                                variant="outlined"
                                sx={{ m: 0.1 }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {row.ShuttleNumber.map((num, i) => (
                              <Chip
                                key={i}
                                label={num}
                                size="small"
                                variant="outlined"
                                sx={{ m: 0.1 }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
