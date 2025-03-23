import { useState, useEffect } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import { Court, MatchHistory, Player } from "../types";
import { useHistoryContext } from "../providers/history-provider";
// import * as dayjs from 'dayjs'
import { flushSync } from "react-dom";
import { rankColor, statusColors } from "../constant";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SportsIcon from "@mui/icons-material/Sports";
import QueueIcon from "@mui/icons-material/Queue";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SecurityIcon from "@mui/icons-material/Security";
import KitchenIcon from "@mui/icons-material/Kitchen";
import { useQueueContext } from "../providers/queue-provider";

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
  const { matchQueue, setMatchQueue, queueIdCounter, setQueueIdCounter } =
    useQueueContext();
  const [leftSidePlayers, setLeftSidePlayers] = useState<Player[]>([]);
  const [rightSidePlayers, setRightSidePlayers] = useState<Player[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [shuttleNumber, setShuttleNumber] = useState(0);
  const [additionalShuttleNumber, setAdditionalShuttleNumber] = useState(0);
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [mergeRanks, setMergeRanks] = useState(false);

  // State for match queue
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

    // Update player status to "queue" for all selected players
    [...leftSidePlayers, ...rightSidePlayers].forEach((player) => {
      updatePlayer(player.name, { status: "queue" });
    });

    // Clear selection after adding to queue
    setLeftSidePlayers([]);
    setRightSidePlayers([]);
    setSelectedCourt("");
  };

  // Function to remove a match from queue
  const removeFromQueue = (id: number) => {
    // Find the queue item before removing it
    const queueItem = matchQueue.find((item) => item.id === id);

    // Update the removed players' status back to "come"
    if (queueItem) {
      [...queueItem.leftSidePlayers, ...queueItem.rightSidePlayers].forEach(
        (player) => {
          // Check if the player is in any other queue items
          const isInOtherQueue = matchQueue.some(
            (item) =>
              item.id !== id &&
              (item.leftSidePlayers.some((p) => p.id === player.id) ||
                item.rightSidePlayers.some((p) => p.id === player.id))
          );

          // Only change status if not in other queue items
          if (!isInOtherQueue) {
            updatePlayerByID(player.id, { status: "come" });
          }
        }
      );
    }

    // Remove the queue item
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
    const playersForSelection = players.filter(
      (player) => player.status === "come" // Only include "come" status, exclude "queue"
    );
    if (playersForSelection.length < 4) {
      alert("Must have at least 4 available players.");
      return;
    }

    flushSync(() => {
      setLeftSidePlayers([]);
      setRightSidePlayers([]);
    });

    // @ts-expect-error randoSequence is defined in rando.js
    const randomedPlayers = randoSequence(playersForSelection);
    console.log(randomedPlayers);
    handlePlayerSelection(randomedPlayers[0].value, "left");
    handlePlayerSelection(randomedPlayers[1].value, "left");
    handlePlayerSelection(randomedPlayers[2].value, "right");
    handlePlayerSelection(randomedPlayers[3].value, "right");
  };

  const handleRandomByRank = () => {
    if (selectedRanks.length === 0) {
      alert("Please select at least one rank to filter players.");
      return;
    }

    const filteredPlayers = players.filter(
      (player) =>
        player.status === "come" && // Only include "come" status, exclude "queue"
        selectedRanks.includes(player.rank)
    );

    if (filteredPlayers.length < 4) {
      alert(
        `Not enough players (${filteredPlayers.length}) in the selected ranks. Need at least 4.`
      );
      return;
    }

    flushSync(() => {
      setLeftSidePlayers([]);
      setRightSidePlayers([]);
    });

    // @ts-expect-error randoSequence is defined in rando.js
    const randomedPlayers = randoSequence(filteredPlayers);
    handlePlayerSelection(randomedPlayers[0].value, "left");
    handlePlayerSelection(randomedPlayers[1].value, "left");
    handlePlayerSelection(randomedPlayers[2].value, "right");
    handlePlayerSelection(randomedPlayers[3].value, "right");
  };

  const handleRandomByWaitingTime = () => {
    if (selectedRanks.length === 0) {
      alert("Please select at least one rank to filter players.");
      return;
    }

    const filteredPlayers = players.filter(
      (player) =>
        player.status === "come" && // Only include "come" status, exclude "queue"
        selectedRanks.includes(player.rank)
    );

    if (filteredPlayers.length < 4) {
      alert(
        `Not enough players (${filteredPlayers.length}) in the selected ranks. Need at least 4.`
      );
      return;
    }

    // Sort by waiting time (smaller waitingSince timestamp = waiting longer)
    const sortedPlayers = [...filteredPlayers].sort(
      (a, b) => a.waitingSince - b.waitingSince
    );

    flushSync(() => {
      setLeftSidePlayers([]);
      setRightSidePlayers([]);
    });

    // Take the 4 players who have been waiting the longest
    handlePlayerSelection(sortedPlayers[0], "left");
    handlePlayerSelection(sortedPlayers[1], "left");
    handlePlayerSelection(sortedPlayers[2], "right");
    handlePlayerSelection(sortedPlayers[3], "right");
  };

  const handleToggleRank = (rank: string) => {
    setSelectedRanks((prev) =>
      prev.includes(rank) ? prev.filter((r) => r !== rank) : [...prev, rank]
    );
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

  // Get appropriate icon for rank
  const getRankIcon = (rank: string) => {
    if (rank === "s" || rank === "s+") {
      return <EmojiEventsIcon fontSize="small" />;
    } else if (rank === "n-" || rank === "n" || rank === "n+") {
      return <SecurityIcon fontSize="small" />;
    } else if (rank === "bg" || rank === "bg+") {
      return <KitchenIcon fontSize="small" />;
    }
    return undefined;
  };

  // Group players by rank for better organization
  const groupPlayersByRank = (players: Player[]) => {
    // Create groups by rank
    const groups: Record<string, Player[]> = {};

    if (mergeRanks) {
      // Initialize merged rank groups
      groups["bg/bg+"] = [];
      groups["n-/n/n+"] = [];
      groups["s/s+"] = [];
      groups["unknow"] = [];

      // Add players to their merged rank groups
      players.forEach((player) => {
        if (player.rank === "bg" || player.rank === "bg+") {
          groups["bg/bg+"].push(player);
        } else if (
          player.rank === "n-" ||
          player.rank === "n" ||
          player.rank === "n+"
        ) {
          groups["n-/n/n+"].push(player);
        } else if (player.rank === "s" || player.rank === "s+") {
          groups["s/s+"].push(player);
        } else {
          groups["unknow"].push(player);
        }
      });

      // Sort players within each group by waiting time
      Object.keys(groups).forEach((rank) => {
        groups[rank].sort((a, b) => {
          return a.waitingSince - b.waitingSince;
        });
      });

      // Return sorted groups, filtering out empty groups
      return Object.entries(groups)
        .filter(([, players]) => players.length > 0)
        .sort((a, b) => {
          const rankPriority = ["bg/bg+", "n-/n/n+", "s/s+", "unknow"];
          return rankPriority.indexOf(a[0]) - rankPriority.indexOf(b[0]);
        });
    } else {
      // Original non-merged implementation
      // Create placeholder for all ranks to ensure they appear even if empty
      const allRanks = ["bg", "bg+", "n-", "n", "n+", "s", "s+", "unknow"];
      allRanks.forEach((rank) => {
        groups[rank] = [];
      });

      // Add players to their rank groups
      players.forEach((player) => {
        if (groups[player.rank]) {
          groups[player.rank].push(player);
        } else {
          // If rank is not in our predefined list, add to unknown
          groups["unknow"].push(player);
        }
      });

      // Sort players within each rank by waiting time (earliest first)
      Object.keys(groups).forEach((rank) => {
        groups[rank].sort((a, b) => {
          // Sort by waiting time (smaller value = earlier time = longer wait)
          return a.waitingSince - b.waitingSince;
        });
      });

      // Sort the ranks by priority
      const rankPriority = ["bg", "bg+", "n-", "n", "n+", "s", "s+", "unknow"];

      // Return sorted groups, filtering out empty groups
      return Object.entries(groups)
        .filter(([, players]) => players.length > 0) // Only include groups with players
        .sort((a, b) => {
          const rankA = rankPriority.indexOf(a[0]);
          const rankB = rankPriority.indexOf(b[0]);
          return rankA - rankB;
        });
    }
  };

  // Get rank color for merged ranks
  const getMergedRankColor = (mergedRank: string): string => {
    if (mergedRank === "bg/bg+") return rankColor["bg+"];
    if (mergedRank === "n-/n/n+") return rankColor["n"];
    if (mergedRank === "s/s+") return rankColor["s"];
    return rankColor["unknow"];
  };

  // Get appropriate icon for merged rank
  const getMergedRankIcon = (mergedRank: string) => {
    if (mergedRank === "s/s+") {
      return <EmojiEventsIcon fontSize="small" />;
    } else if (mergedRank === "n-/n/n+") {
      return <SecurityIcon fontSize="small" />;
    } else if (mergedRank === "bg/bg+") {
      return <KitchenIcon fontSize="small" />;
    }
    return undefined;
  };

  const availableCourts = courts.filter((p) => p.status === "available");
  const availablePlayers = players
    .filter((p) => p.status === "come") // Only include "come" status, exclude "queue" and "playing"
    .sort((a, b) => a.id - b.id);
  const rankedPlayers = groupPlayersByRank(availablePlayers);
  const ongoingMatches = courts
    .filter((court) => court.status === "using" && court.currentMatch)
    .sort((a, b) => (a.name > b.name ? 1 : -1));

  const getCourtName = (courtName: string) => {
    const court = courts.find((c) => c.name === courtName);
    return court ? court.name : "Unknown court";
  };

  // Add a function to get the current player details
  const getUpdatedPlayer = (player: Player): Player => {
    const currentPlayer = players.find((p) => p.id === player.id);
    return currentPlayer || player;
  };

  // Add a useEffect to sync player statuses with queue
  useEffect(() => {
    // Sync queue status with player status
    const queuedPlayers = players.filter((player) => player.status === "queue");

    queuedPlayers.forEach((player) => {
      const isInQueue = matchQueue.some(
        (queueItem) =>
          queueItem.leftSidePlayers.some((p) => p.id === player.id) ||
          queueItem.rightSidePlayers.some((p) => p.id === player.id)
      );

      if (!isInQueue) {
        updatePlayer(player.name, { status: "come" });
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchQueue, players]);

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h5" gutterBottom>
        Match Management
      </Typography>

      {/* Ongoing Matches Section */}
      <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <SportsIcon sx={{ mr: 1 }} /> Ongoing Matches
        </Typography>

        {ongoingMatches.length === 0 ? (
          <Alert severity="info" sx={{ my: 1.5 }} variant="outlined">
            No ongoing matches. Start a new match below.
          </Alert>
        ) : (
          <Grid container spacing={1.5}>
            {ongoingMatches.map((court, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent sx={{ pb: 1, pt: 1.5, px: 1.5 }}>
                    <Typography variant="h6" color="primary">
                      Court: {court.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 0.5,
                        mb: 1.5,
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

                    <Divider sx={{ mb: 1.5 }} />

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
      <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <QueueIcon sx={{ mr: 1 }} /> Match Queue
        </Typography>

        {matchQueue.length === 0 ? (
          <Alert severity="info" sx={{ my: 1.5 }} variant="outlined">
            No matches in queue. Create a new match below and add it to the
            queue.
          </Alert>
        ) : (
          <Grid container spacing={1.5}>
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
                        Court: Not assigned
                      </Typography>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Left Side
                        </Typography>
                        {queueItem.leftSidePlayers.map((player) => {
                          // Get current player state
                          const currentPlayer = getUpdatedPlayer(player);
                          return (
                            <Chip
                              key={player.id}
                              label={currentPlayer.name}
                              size="small"
                              sx={{
                                bgcolor:
                                  statusColors[currentPlayer.status] ||
                                  statusColors.come,
                                color: "white",
                                mb: 0.5,
                              }}
                            />
                          );
                        })}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Right Side
                        </Typography>
                        {queueItem.rightSidePlayers.map((player) => {
                          // Get current player state
                          const currentPlayer = getUpdatedPlayer(player);
                          return (
                            <Chip
                              key={player.id}
                              label={currentPlayer.name}
                              size="small"
                              sx={{
                                bgcolor:
                                  statusColors[currentPlayer.status] ||
                                  statusColors.come,
                                color: "white",
                                mb: 0.5,
                              }}
                            />
                          );
                        })}
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
      <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" gutterBottom>
          Create New Match
        </Typography>

        {/* Court Selection */}
        <Box sx={{ mb: 2 }}>
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

        {/* Merge rank toggle */}
        <Box sx={{ mb: 2, mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={mergeRanks}
                onChange={() => setMergeRanks(!mergeRanks)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                Merge ranks (bg/bg+, n-/n/n+, s/s+)
              </Typography>
            }
          />
        </Box>

        <Grid container spacing={3}>
          {/* Left Side Player Selection */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: "#e3f2fd",
                  borderRadius: "4px 4px 0 0",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Left Side Players
                  </Typography>
                  <Chip
                    label={`${leftSidePlayers.length}/2`}
                    color={leftSidePlayers.length === 2 ? "success" : "default"}
                    size="small"
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {availablePlayers.length === 0 ? (
                  <Alert severity="warning">No players available</Alert>
                ) : (
                  <Box sx={{ width: "100%" }}>
                    <Grid container spacing={2}>
                      {rankedPlayers.map(([rank, players]) => (
                        <Grid item xs={6} sm={6} md={4} key={rank}>
                          <Box
                            sx={{
                              height: "100%",
                              minHeight: "150px",
                              border: `1px solid ${
                                mergeRanks
                                  ? getMergedRankColor(rank)
                                  : rankColor[rank] || rankColor["unknown"]
                              }`,
                              borderRadius: 1,
                              p: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: mergeRanks
                                  ? getMergedRankColor(rank)
                                  : getRankColor(rank),
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                mb: 1,
                                textAlign: "center",
                                color:
                                  rank === "unknow" ? "text.primary" : "white",
                              }}
                            >
                              {rank !== "unknow" &&
                                (mergeRanks
                                  ? getMergedRankIcon(rank)
                                  : getRankIcon(rank))}{" "}
                              {rank} ({players.length})
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: 1,
                                justifyContent: "space-between",
                              }}
                            >
                              {players.map((player) => (
                                <Chip
                                  key={player.id}
                                  label={player.name}
                                  onClick={() =>
                                    handlePlayerSelection(player, "left")
                                  }
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
                                  sx={{
                                    my: 0.5,
                                    flexBasis: "calc(50% - 8px)",
                                    maxWidth: "calc(50% - 8px)",
                                    height: "auto",
                                    "& .MuiChip-label": {
                                      overflow: "visible",
                                      textOverflow: "clip",
                                      whiteSpace: "normal",
                                      lineHeight: "1.2",
                                      paddingTop: "4px",
                                      paddingBottom: "4px",
                                    },
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Right Side Player Selection */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: "#fff8e1",
                  borderRadius: "4px 4px 0 0",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Right Side Players
                  </Typography>
                  <Chip
                    label={`${rightSidePlayers.length}/2`}
                    color={
                      rightSidePlayers.length === 2 ? "success" : "default"
                    }
                    size="small"
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {availablePlayers.length === 0 ? (
                  <Alert severity="warning">No players available</Alert>
                ) : (
                  <Box sx={{ width: "100%" }}>
                    <Grid container spacing={2}>
                      {rankedPlayers.map(([rank, players]) => (
                        <Grid item xs={6} sm={6} md={4} key={rank}>
                          <Box
                            sx={{
                              height: "100%",
                              minHeight: "150px",
                              border: `1px solid ${
                                mergeRanks
                                  ? getMergedRankColor(rank)
                                  : rankColor[rank] || rankColor["unknown"]
                              }`,
                              borderRadius: 1,
                              p: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: mergeRanks
                                  ? getMergedRankColor(rank)
                                  : getRankColor(rank),
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                mb: 1,
                                textAlign: "center",
                                color:
                                  rank === "unknow" ? "text.primary" : "white",
                              }}
                            >
                              {rank !== "unknow" &&
                                (mergeRanks
                                  ? getMergedRankIcon(rank)
                                  : getRankIcon(rank))}{" "}
                              {rank} ({players.length})
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: 1,
                                justifyContent: "space-between",
                              }}
                            >
                              {players.map((player) => (
                                <Chip
                                  key={player.id}
                                  label={player.name}
                                  onClick={() =>
                                    handlePlayerSelection(player, "right")
                                  }
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
                                  sx={{
                                    my: 0.5,
                                    flexBasis: "calc(50% - 8px)",
                                    maxWidth: "calc(50% - 8px)",
                                    height: "auto",
                                    "& .MuiChip-label": {
                                      overflow: "visible",
                                      textOverflow: "clip",
                                      whiteSpace: "normal",
                                      lineHeight: "1.2",
                                      paddingTop: "4px",
                                      paddingBottom: "4px",
                                    },
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>

        {/* Shuttle Number Input - only shown for direct match start */}
        <Box sx={{ mt: 2, mb: 2 }}>
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

        {/* Rank Selection for Random Options */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select Ranks for Random Selection
          </Typography>

          {/* Selected Ranks Box */}
          {selectedRanks.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                mb: 2,
                border: "1px solid",
                borderColor: "primary.main",
                borderRadius: 1,
                bgcolor: "primary.light",
                opacity: 0.8,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Ranks:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {mergeRanks
                  ? // Display merged rank groups
                    [
                      { key: "bg/bg+", ranks: ["bg", "bg+"] },
                      { key: "n-/n/n+", ranks: ["n-", "n", "n+"] },
                      { key: "s/s+", ranks: ["s", "s+"] },
                      { key: "unknow", ranks: ["unknow"] },
                    ]
                      .filter((group) =>
                        group.ranks.some((r) => selectedRanks.includes(r))
                      )
                      .map((group) => (
                        <Chip
                          key={group.key}
                          label={group.key}
                          icon={getMergedRankIcon(group.key)}
                          onDelete={() => {
                            // Remove all ranks in this group that are already selected
                            const ranksToRemove = group.ranks.filter((r) =>
                              selectedRanks.includes(r)
                            );
                            setSelectedRanks(
                              selectedRanks.filter(
                                (r) => !ranksToRemove.includes(r)
                              )
                            );
                          }}
                          color="primary"
                          variant="filled"
                          size="small"
                          sx={{
                            m: 0.5,
                            fontWeight: "bold",
                            boxShadow: 1,
                            bgcolor: `${getMergedRankColor(group.key)}40`,
                          }}
                        />
                      ))
                  : // Original individual rank display
                    selectedRanks.map((rank) => (
                      <Chip
                        key={rank}
                        label={rank}
                        icon={rank !== "unknow" ? getRankIcon(rank) : undefined}
                        onDelete={() => handleToggleRank(rank)}
                        color="primary"
                        variant="filled"
                        size="small"
                        sx={{
                          m: 0.5,
                          fontWeight: "bold",
                          boxShadow: 1,
                          bgcolor: `${rankColor[rank]}40`,
                        }}
                      />
                    ))}
              </Stack>
            </Box>
          )}

          {/* Available Ranks */}
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Available Ranks:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {mergeRanks
              ? // Merged rank options
                [
                  { key: "bg/bg+", ranks: ["bg", "bg+"] },
                  { key: "n-/n/n+", ranks: ["n-", "n", "n+"] },
                  { key: "s/s+", ranks: ["s", "s+"] },
                  { key: "unknow", ranks: ["unknow"] },
                ]
                  .filter(
                    (group) =>
                      !group.ranks.every((r) => selectedRanks.includes(r))
                  )
                  .map((group) => (
                    <Chip
                      key={group.key}
                      label={group.key}
                      icon={
                        group.key !== "unknow"
                          ? getMergedRankIcon(group.key)
                          : undefined
                      }
                      onClick={() => {
                        // Add all ranks in this group that aren't already selected
                        const ranksToAdd = group.ranks.filter(
                          (r) => !selectedRanks.includes(r)
                        );
                        if (ranksToAdd.length > 0) {
                          setSelectedRanks([...selectedRanks, ...ranksToAdd]);
                        }
                      }}
                      color="default"
                      variant="outlined"
                      size="small"
                      sx={{
                        m: 0.5,
                        border: "1px solid",
                        transition: "all 0.2s ease",
                        bgcolor: `${getMergedRankColor(group.key)}15`,
                        color: "black",
                        "& .MuiChip-label": {
                          color: "black",
                        },
                      }}
                    />
                  ))
              : // Original individual rank options
                ["bg", "bg+", "n-", "n", "n+", "s", "s+", "unknow"]
                  .filter((rank) => !selectedRanks.includes(rank))
                  .map((rank) => (
                    <Chip
                      key={rank}
                      label={rank}
                      icon={rank !== "unknow" ? getRankIcon(rank) : undefined}
                      onClick={() => handleToggleRank(rank)}
                      color="default"
                      variant="outlined"
                      size="small"
                      sx={{
                        m: 0.5,
                        border: "1px solid",
                        transition: "all 0.2s ease",
                        bgcolor: `${rankColor[rank]}15`,
                        color: "black",
                        "& .MuiChip-label": {
                          color: "black",
                        },
                      }}
                    />
                  ))}
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 2.5 }}
        >
          <Button
            variant="text"
            color="secondary"
            startIcon={<ShuffleIcon />}
            onClick={handleRandomSelectPlayers}
            disabled={availablePlayers.length < 4}
            size="small"
          >
            Random All
          </Button>

          <Button
            variant="text"
            color="secondary"
            startIcon={<ShuffleIcon />}
            onClick={handleRandomByRank}
            disabled={selectedRanks.length === 0}
            size="small"
          >
            Random by Rank
          </Button>

          <Button
            variant="text"
            color="secondary"
            startIcon={<AccessTimeIcon />}
            onClick={handleRandomByWaitingTime}
            disabled={selectedRanks.length === 0}
            size="small"
          >
            Random by Wait Time
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<QueueIcon />}
            onClick={addToQueue}
            disabled={
              leftSidePlayers.length !== 2 || rightSidePlayers.length !== 2
            }
            size="small"
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
            size="small"
          >
            Start Match Now
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
