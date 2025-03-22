import { useState } from "react";
import {
  Button,
  Typography,
  Box,
  TextField,
  Stack,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Divider,
  Paper,
  Container,
  Alert,
  IconButton,
} from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import { Court, MatchHistory, Player } from "../types";
import { useHistoryContext } from "../providers/history-provider";
// import * as dayjs from 'dayjs'
import { flushSync } from "react-dom";
import { rankColor } from "../constant";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SportsIcon from "@mui/icons-material/Sports";
import QueueIcon from "@mui/icons-material/Queue";
import DeleteIcon from "@mui/icons-material/Delete";

// Interface for queued match
interface QueuedMatch {
  id: number;
  leftSidePlayers: Player[];
  rightSidePlayers: Player[];
  court?: string; // Make court optional
}

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

  // State for match queue
  const [matchQueue, setMatchQueue] = useState<QueuedMatch[]>([]);
  const [queueIdCounter, setQueueIdCounter] = useState(1);
  const [selectedQueueItem, setSelectedQueueItem] =
    useState<QueuedMatch | null>(null);

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
      alert(
        "Select 2 players per side, a court, and enter valid shuttle number."
      );
      return;
    }

    const shuttleNum = parseInt(shuttleNumber.toString(), 10);
    const addShuttleSuccess = addShuttle(shuttleNum);
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
                ShuttleNumber: [shuttleNum],
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

  // Function to start a match from the queue
  const startQueuedMatch = (queuedMatch: QueuedMatch) => {
    // Check for court and shuttle
    if (!queuedMatch.court) {
      alert("Please select a court for this match.");
      return;
    }

    if (!shuttleNumber) {
      alert("Please enter a valid shuttle number to start the match.");
      return;
    }

    const shuttleNum = parseInt(shuttleNumber.toString(), 10);
    const addShuttleSuccess = addShuttle(shuttleNum);
    if (!addShuttleSuccess) {
      return;
    }

    setCourts(
      courts.map((court) =>
        court.name === queuedMatch.court
          ? {
              ...court,
              status: "using",
              currentMatch: {
                leftSidePlayersID: queuedMatch.leftSidePlayers.map((p) => p.id),
                rightSidePlayersID: queuedMatch.rightSidePlayers.map(
                  (p) => p.id
                ),
                startedTime: Date.now(),
                ShuttleNumber: [shuttleNum],
                endedTime: null,
                WinnerPlayersID: [],
                LoserPlayersID: [],
                SetResult: false,
              },
            }
          : court
      )
    );

    [...queuedMatch.leftSidePlayers, ...queuedMatch.rightSidePlayers].forEach(
      (player) => updatePlayer(player.name, { status: "playing" })
    );

    // Remove the started match from queue
    setMatchQueue(matchQueue.filter((match) => match.id !== queuedMatch.id));
    setShuttleNumber(0);
    setSelectedQueueItem(null);
  };

  // Function to add current selection to queue
  const addToQueue = () => {
    if (leftSidePlayers.length !== 2 || rightSidePlayers.length !== 2) {
      alert("Select 2 players per side to add to queue.");
      return;
    }

    const newQueueItem: QueuedMatch = {
      id: queueIdCounter,
      leftSidePlayers: [...leftSidePlayers],
      rightSidePlayers: [...rightSidePlayers],
      court: selectedCourt || undefined, // Make court optional
    };

    setMatchQueue([...matchQueue, newQueueItem]);
    setQueueIdCounter(queueIdCounter + 1);

    // Clear selection after adding to queue
    setLeftSidePlayers([]);
    setRightSidePlayers([]);
    setSelectedCourt("");
  };

  // Function to remove a match from queue
  const removeFromQueue = (id: number) => {
    setMatchQueue(matchQueue.filter((match) => match.id !== id));
    if (selectedQueueItem?.id === id) {
      setSelectedQueueItem(null);
    }
  };

  // Function to select a queued match for starting
  const selectQueueItem = (queueItem: QueuedMatch) => {
    setSelectedQueueItem(queueItem);
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
    console.log("addi: ", additionalShuttleNumber);
    console.log("shuttles: ", shuttles.join(","));

    if (
      !currentCourt.currentMatch ||
      currentCourt.status !== "using" ||
      additionalShuttleNumber <= 0
    ) {
      alert("Invalid shuttle number");
      setAdditionalShuttleNumber(0);
      return;
    }

    const shuttleNum = parseInt(additionalShuttleNumber.toString(), 10);
    const addShuttleSuccess = addShuttle(shuttleNum);
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
                ShuttleNumber: [
                  ...(currentCourt.currentMatch?.ShuttleNumber || []),
                  shuttleNum,
                ],
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
        return;
      }
      if (!currentCourt.currentMatch) {
        return;
      }
      updatePlayerByID(playerId, {
        history: [...currentPlayer.history, currentCourt.currentMatch],
      });
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

  const getRankColor = (rank: string) => {
    return rankColor[rank] || rankColor["unknown"];
  };

  // Group players by rank for better organization
  const groupPlayersByRank = (players: Player[]) => {
    // Create groups by rank
    const groups: Record<string, Player[]> = {};

    players.forEach((player) => {
      if (!groups[player.rank]) {
        groups[player.rank] = [];
      }
      groups[player.rank].push(player);
    });

    // Sort players within each rank by waiting time (earliest first)
    Object.keys(groups).forEach((rank) => {
      groups[rank].sort((a, b) => {
        // Sort by waiting time (smaller value = earlier time = longer wait)
        return a.waitingSince - b.waitingSince;
      });
    });

    // Sort the ranks by priority
    const rankPriority = ["s+", "s", "n+", "n", "n-", "bg+", "bg", "unknow"];

    // Return sorted groups
    return Object.entries(groups).sort((a, b) => {
      const rankA = rankPriority.indexOf(a[0]);
      const rankB = rankPriority.indexOf(b[0]);
      return rankA - rankB;
    });
  };

  const availableCourts = courts.filter((p) => p.status === "available");
  const availablePlayers = players
    .filter((p) => p.status === "come")
    .sort((a, b) => a.id - b.id);
  const rankedPlayers = groupPlayersByRank(availablePlayers);
  const ongoingMatches = courts
    .filter((court) => court.status === "using" && court.currentMatch)
    .sort((a, b) => (a.name > b.name ? 1 : -1));

  const getCourtName = (courtName: string) => {
    const court = courts.find((c) => c.name === courtName);
    return court ? court.name : "Unknown court";
  };

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h5" gutterBottom>
        Match Management
      </Typography>

      {/* Ongoing Matches Section */}
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <SportsIcon sx={{ mr: 1 }} /> Ongoing Matches
        </Typography>

        {ongoingMatches.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No ongoing matches. Start a new match below.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {ongoingMatches.map((court, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Court: {court.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 1,
                        mb: 2,
                      }}
                    >
                      <AccessTimeIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {court.currentMatch?.startedTime
                          ? `${Math.floor(
                              (Date.now() - court.currentMatch.startedTime) /
                                60000
                            )} mins`
                          : "N/A"}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Left Side
                        </Typography>
                        <Typography>
                          {court.currentMatch?.leftSidePlayersID
                            .map((id) => players.find((p) => p.id === id)?.name)
                            .join(", ")}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2" color="text.secondary">
                          Right Side
                        </Typography>
                        <Typography>
                          {court.currentMatch?.rightSidePlayersID
                            .map((id) => players.find((p) => p.id === id)?.name)
                            .join(", ")}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Shuttles Used
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {court.currentMatch?.ShuttleNumber.map((num, i) => (
                          <Chip key={i} label={num} size="small" />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                      <TextField
                        variant="outlined"
                        type="number"
                        size="small"
                        label="Shuttle"
                        value={additionalShuttleNumber || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setAdditionalShuttleNumber(0);
                          } else if (/^[0-9]+$/.test(value)) {
                            setAdditionalShuttleNumber(parseInt(value, 10));
                          }
                        }}
                        sx={{ flexGrow: 1 }}
                        inputProps={{ min: 1 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddShuttle(court)}
                      >
                        Add
                      </Button>
                    </Stack>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                        mt: 1,
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<StopIcon />}
                        onClick={() => handleEndMatch(court)}
                      >
                        End Match
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Match Queue Section */}
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <QueueIcon sx={{ mr: 1 }} /> Match Queue
        </Typography>

        {matchQueue.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No matches in queue. Create a new match below and add it to the
            queue.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {matchQueue.map((queueItem) => (
              <Grid item xs={12} sm={6} md={4} key={queueItem.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    border:
                      selectedQueueItem?.id === queueItem.id
                        ? "2px solid #1976d2"
                        : undefined,
                  }}
                  onClick={() => selectQueueItem(queueItem)}
                >
                  <CardContent>
                    {queueItem.court ? (
                      <Typography variant="h6" color="primary">
                        Court: {getCourtName(queueItem.court)}
                      </Typography>
                    ) : (
                      <Typography variant="h6" color="text.secondary">
                        No Court Selected
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Left Side
                        </Typography>
                        <Typography>
                          {queueItem.leftSidePlayers
                            .map((p) => p.name)
                            .join(", ")}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2" color="text.secondary">
                          Right Side
                        </Typography>
                        <Typography>
                          {queueItem.rightSidePlayers
                            .map((p) => p.name)
                            .join(", ")}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <IconButton
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(queueItem.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>

                      {selectedQueueItem?.id === queueItem.id && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          justifyContent="flex-end"
                        >
                          {!queueItem.court && (
                            <Box sx={{ minWidth: "140px", mr: 1 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                              >
                                {availableCourts.length === 0 ? (
                                  <Typography variant="caption" color="error">
                                    No courts available
                                  </Typography>
                                ) : (
                                  availableCourts.map((court) => (
                                    <Chip
                                      key={court.name}
                                      label={court.name}
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Update the court for this queue item
                                        setMatchQueue(
                                          matchQueue.map((match) =>
                                            match.id === queueItem.id
                                              ? { ...match, court: court.name }
                                              : match
                                          )
                                        );
                                      }}
                                      color="primary"
                                      variant="outlined"
                                      sx={{ my: 0.5 }}
                                    />
                                  ))
                                )}
                              </Stack>
                            </Box>
                          )}
                          <TextField
                            type="number"
                            variant="outlined"
                            size="small"
                            label="Shuttle #"
                            value={shuttleNumber || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                setShuttleNumber(0);
                              } else if (/^[0-9]+$/.test(value)) {
                                setShuttleNumber(parseInt(value, 10));
                              }
                            }}
                            sx={{ width: "100px" }}
                            inputProps={{ min: 1 }}
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              startQueuedMatch(queueItem);
                            }}
                            disabled={!shuttleNumber || !queueItem.court}
                          >
                            Start
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* New Match Creation Section */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Create New Match
        </Typography>

        {/* Court Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select Court
          </Typography>
          {availableCourts.length === 0 ? (
            <Alert severity="warning">No courts available</Alert>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {availableCourts.map((court) => (
                <Chip
                  key={court.name}
                  label={court.name}
                  onClick={() => setSelectedCourt(court.name)}
                  color={selectedCourt === court.name ? "primary" : "default"}
                  variant={selectedCourt === court.name ? "filled" : "outlined"}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Left Side Player Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Left Side Players ({leftSidePlayers.length}/2)
            </Typography>
            {availablePlayers.length === 0 ? (
              <Alert severity="warning">No players available</Alert>
            ) : (
              <Stack spacing={1.5}>
                {rankedPlayers.map(([rank, players]) => (
                  <Box key={rank}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "inline-block",
                        bgcolor: getRankColor(rank),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        mb: 0.5,
                        color: rank === "unknow" ? "text.primary" : "white",
                      }}
                    >
                      {rank} ({players.length})
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {players.map((player) => (
                        <Chip
                          key={player.id}
                          label={player.name}
                          onClick={() => handlePlayerSelection(player, "left")}
                          color={
                            leftSidePlayers.includes(player)
                              ? "primary"
                              : "default"
                          }
                          variant={
                            leftSidePlayers.includes(player)
                              ? "filled"
                              : "outlined"
                          }
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Grid>

          {/* Right Side Player Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Right Side Players ({rightSidePlayers.length}/2)
            </Typography>
            {availablePlayers.length === 0 ? (
              <Alert severity="warning">No players available</Alert>
            ) : (
              <Stack spacing={1.5}>
                {rankedPlayers.map(([rank, players]) => (
                  <Box key={rank}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "inline-block",
                        bgcolor: getRankColor(rank),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        mb: 0.5,
                        color: rank === "unknow" ? "text.primary" : "white",
                      }}
                    >
                      {rank} ({players.length})
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {players.map((player) => (
                        <Chip
                          key={player.id}
                          label={player.name}
                          onClick={() => handlePlayerSelection(player, "right")}
                          color={
                            rightSidePlayers.includes(player)
                              ? "primary"
                              : "default"
                          }
                          variant={
                            rightSidePlayers.includes(player)
                              ? "filled"
                              : "outlined"
                          }
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>

        {/* Shuttle Number Input - only shown for direct match start */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Shuttle Number (required for starting match)
          </Typography>
          <TextField
            type="number"
            variant="outlined"
            size="small"
            label="Enter shuttle number"
            value={shuttleNumber || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setShuttleNumber(0);
              } else if (/^[0-9]+$/.test(value)) {
                setShuttleNumber(parseInt(value, 10));
              }
            }}
            sx={{ width: "200px" }}
            inputProps={{ min: 1 }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Shuttles Used: {shuttles.map((s) => s.number).join(", ")}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 3 }}
        >
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ShuffleIcon />}
            onClick={handleRandomSelectPlayers}
            disabled={availablePlayers.length < 4}
          >
            Random Selection
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<QueueIcon />}
            onClick={addToQueue}
            disabled={
              leftSidePlayers.length !== 2 || rightSidePlayers.length !== 2
            }
          >
            Add To Queue
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={startMatch}
            disabled={
              leftSidePlayers.length !== 2 ||
              rightSidePlayers.length !== 2 ||
              selectedCourt === "" ||
              !shuttleNumber
            }
          >
            Start Match Now
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
