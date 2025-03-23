import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Divider,
  Tooltip,
  Grid,
  Menu,
  MenuItem,
  IconButton,
  Alert,
} from "@mui/material";
import { Player } from "../types";
import { usePlayerContext } from "../providers/player-provider";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { statusColors, rankColor } from "../constant";
import moment from "moment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import PaidIcon from "@mui/icons-material/Paid";
import HomeIcon from "@mui/icons-material/Home";
import PauseIcon from "@mui/icons-material/Pause";
import PersonIcon from "@mui/icons-material/Person";

// Helper function to capitalize first letter of a string
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function PlayerRow({
  players,
}: {
  readonly players: readonly Player[];
}) {
  const { updatePlayer, updatePlayerByID } = usePlayerContext();
  const [currentTime, setCurrentTime] = useState(moment.now());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState<string | null>(null);
  const [rankMenuAnchorEl, setRankMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState<string>("");

  const rankOptions = ["bg", "bg+", "n-", "n", "n+", "s", "s+", "unknow"];

  const handleRankMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    player: Player
  ) => {
    setRankMenuAnchorEl(event.currentTarget);
    setSelectedPlayer(player);
  };

  const handleRankMenuClose = () => {
    setRankMenuAnchorEl(null);
    setSelectedPlayer(null);
  };

  const handleRankChange = (rank: string) => {
    if (selectedPlayer) {
      updatePlayer(selectedPlayer.name, { rank });
      handleRankMenuClose();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Group players by name, keeping only one entry per player
  const uniquePlayerNames = [...new Set(players.map((player) => player.name))];

  // For each unique player name, find the corresponding player object
  const uniquePlayers = uniquePlayerNames
    .map((name) => players.find((player) => player.name === name))
    .filter((player) => player !== undefined);

  // Filter players based on search term and selected rank
  const filteredPlayers =
    searchTerm.trim() === "" && selectedRank === null
      ? uniquePlayers // show all unique players if no search term and no rank filter
      : uniquePlayers.filter((player) => {
          // Filter by name if search term exists
          const nameMatch =
            searchTerm.trim() === "" ||
            player.name.toLowerCase().startsWith(searchTerm.toLowerCase());

          // Filter by rank if a rank is selected
          const rankMatch =
            selectedRank === null || player.rank === selectedRank;

          // Return true only if both conditions are met
          return nameMatch && rankMatch;
        });

  const handleCome = (player: Player) => {
    if (player.status !== "come") {
      // When bringing a player from offline status, also set isPaid to false
      if (player.status === "offline") {
        updatePlayer(player.name, {
          status: "come",
          waitingSince: Date.now(),
          isPaid: false,
        });
      } else {
        updatePlayer(player.name, {
          status: "come",
          waitingSince: Date.now(),
        });
      }
    }
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
      if (confirm(`Unpaid ${player.name}?`)) {
        updatePlayer(player.name, { isPaid: !player.isPaid, status: "come" });
      }
    }
    if (!player.isPaid) {
      const shuttlesUsed = shuttleCount(player);

      // If no shuttles used, total fee is 0
      const totalFee = shuttlesUsed === 0 ? 0 : 80 + 22 * shuttlesUsed;

      if (
        confirm(`${player.name}\nFee: ฿${totalFee}\n(${shuttlesUsed} shuttles)`)
      ) {
        updatePlayer(player.name, {
          isPaid: !player.isPaid,
          status: "go home",
        });
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

  const getRankChipColor = (
    rank: string
  ): "success" | "warning" | "primary" | "error" | "info" | "default" => {
    const rankMap: Record<
      string,
      "success" | "warning" | "primary" | "error" | "info" | "default"
    > = {
      bg: "warning",
      "bg+": "warning",
      "n-": "default",
      n: "default",
      "n+": "default",
      s: "primary",
      "s+": "primary",
      unknow: "default",
    };
    return rankMap[rank] || "default";
  };

  // Sort players by status priority, then by waiting time
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    // Define status priority (lower number = higher priority)
    const statusPriority: Record<string, number> = {
      come: 1,
      playing: 2,
      pause: 3,
      "go home": 4,
      offline: 5,
    };

    // First compare by status priority
    const statusComparison =
      (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);

    // If status is the same, sort by waiting time (longer wait time first)
    return statusComparison !== 0
      ? statusComparison
      : a.waitingSince - b.waitingSince;
  });

  // Group players by status for displaying with headings
  const groupPlayersByStatus = (players: Player[]) => {
    // Create groups by status
    const groups: Record<string, Player[]> = {};

    players.forEach((player) => {
      if (!groups[player.status]) {
        groups[player.status] = [];
      }
      groups[player.status].push(player);
    });

    // Sort the statuses by priority
    const statusPriority = [
      "come",
      "queue",
      "playing",
      "pause",
      "go home",
      "offline",
    ];

    // Return sorted groups
    return Object.entries(groups).sort((a, b) => {
      const statusA = statusPriority.indexOf(a[0]);
      const statusB = statusPriority.indexOf(b[0]);
      return statusA - statusB;
    });
  };

  const groupedPlayers = groupPlayersByStatus(sortedPlayers);

  const handleEditPlayerName = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  };

  const handleSavePlayerName = (player: Player) => {
    if (editingPlayerName.trim() === "") {
      alert("Player name cannot be empty");
      return;
    }

    // Check if the name already exists (excluding the current player)
    const nameExists = players.some(
      (p) => p.name === editingPlayerName && p.id !== player.id
    );

    if (nameExists) {
      alert("Player name must be unique");
      return;
    }

    updatePlayerByID(player.id, { name: editingPlayerName });
    setEditingPlayerId(null);
    setEditingPlayerName("");
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="Search player by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: "300px" }}
          />
        </Stack>

        {/* Rank filter buttons */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Filter by Rank:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            <Chip
              label="All"
              variant={selectedRank === null ? "filled" : "outlined"}
              color="default"
              onClick={() => setSelectedRank(null)}
              sx={{ m: 0.5 }}
            />
            {rankOptions.map((rank) => (
              <Chip
                key={rank}
                label={rank}
                variant={selectedRank === rank ? "filled" : "outlined"}
                sx={{
                  m: 0.5,
                  bgcolor:
                    selectedRank === rank ? rankColor[rank] : "transparent",
                  color: selectedRank === rank ? "white" : "inherit",
                  borderColor: rankColor[rank],
                  borderWidth: selectedRank === rank ? 2 : 1,
                  boxShadow: selectedRank === rank ? 2 : 0,
                  fontWeight: selectedRank === rank ? "bold" : "normal",
                  transform: selectedRank === rank ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
                onClick={() =>
                  setSelectedRank(rank === selectedRank ? null : rank)
                }
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {(searchTerm.trim() !== "" || selectedRank !== null) &&
        filteredPlayers.length === 0 && (
          <Alert severity="info" sx={{ mb: 1 }}>
            No players found matching the current filters
          </Alert>
        )}

      {groupedPlayers.map(([status, players]) => (
        <Box key={status} sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              color: "white",
              bgcolor: statusColors[status] || "#757575",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              display: "inline-block",
            }}
          >
            {capitalize(status)} ({players.length})
          </Typography>
          <Grid container spacing={1}>
            {players.map((player, index) => (
              <Grid key={index} item xs={12} sm={4} md={3} lg={2}>
                <Card
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${
                      statusColors[player.status] || "#757575"
                    }`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent sx={{ pt: 1, pb: 0, px: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ minWidth: "60%" }}
                      >
                        {editingPlayerId === player.id ? (
                          // Editing mode
                          <TextField
                            size="small"
                            value={editingPlayerName}
                            onChange={(e) =>
                              setEditingPlayerName(e.target.value)
                            }
                            autoFocus
                            sx={{
                              minWidth: "150px",
                              "& .MuiInputBase-root": {
                                height: "32px",
                                fontSize: "0.9rem",
                              },
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleSavePlayerName(player)}
                                  >
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              onKeyDown: (e) => {
                                if (e.key === "Enter") {
                                  handleSavePlayerName(player);
                                } else if (e.key === "Escape") {
                                  setEditingPlayerId(null);
                                }
                              },
                            }}
                          />
                        ) : (
                          // Display mode with edit button
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: "medium",
                                fontSize: "1rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "130px",
                                minWidth: "50px",
                              }}
                            >
                              {player.name}
                            </Typography>
                            {!isReadOnly(player) && (
                              <IconButton
                                size="small"
                                onClick={() => handleEditPlayerName(player)}
                                sx={{ p: 0.3 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        )}

                        <Tooltip title="Click to change rank">
                          <Chip
                            size="small"
                            label={player.rank}
                            color={getRankChipColor(player.rank)}
                            onClick={(e) =>
                              !isReadOnly(player) &&
                              handleRankMenuOpen(e, player)
                            }
                            sx={{
                              cursor: !isReadOnly(player)
                                ? "pointer"
                                : "default",
                              bgcolor:
                                rankColor[player.rank] || rankColor["unknown"],
                              color: "white",
                            }}
                            deleteIcon={
                              !isReadOnly(player) ? (
                                <EditIcon fontSize="small" />
                              ) : undefined
                            }
                            onDelete={
                              !isReadOnly(player)
                                ? (e) => handleRankMenuOpen(e, player)
                                : undefined
                            }
                          />
                        </Tooltip>
                      </Stack>
                      <Chip
                        size="small"
                        label={`#${player.id}`}
                        variant="outlined"
                      />
                    </Stack>

                    <Divider sx={{ my: 0.5 }} />

                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      <Tooltip title="Status">
                        <Chip
                          size="small"
                          label={player.status}
                          sx={{
                            backgroundColor: statusColors[player.status],
                            color: "white",
                            height: "20px",
                            "& .MuiChip-label": {
                              px: 0.5,
                              fontSize: "0.7rem",
                            },
                          }}
                        />
                      </Tooltip>

                      <Tooltip title="Matches played">
                        <Chip
                          size="small"
                          icon={
                            <SportsEsportsIcon style={{ fontSize: "0.8rem" }} />
                          }
                          label={player.history.length}
                          variant="outlined"
                          sx={{
                            height: "20px",
                            "& .MuiChip-label": {
                              px: 0.5,
                              fontSize: "0.7rem",
                            },
                          }}
                        />
                      </Tooltip>

                      <Tooltip title="Shuttles used">
                        <Chip
                          size="small"
                          icon={
                            <SportsTennisIcon style={{ fontSize: "0.8rem" }} />
                          }
                          label={shuttleCount(player)}
                          variant="outlined"
                          sx={{
                            height: "20px",
                            "& .MuiChip-label": {
                              px: 0.5,
                              fontSize: "0.7rem",
                            },
                          }}
                        />
                      </Tooltip>

                      {player.status === "come" && (
                        <Tooltip title="Waiting time">
                          <Chip
                            size="small"
                            icon={
                              <AccessTimeIcon style={{ fontSize: "0.8rem" }} />
                            }
                            label={(() => {
                              // Calculate elapsed time in milliseconds
                              const elapsedMs =
                                currentTime - player.waitingSince;
                              // Convert to minutes and seconds
                              const minutes = Math.floor(elapsedMs / 60000);
                              const seconds = Math.floor(
                                (elapsedMs % 60000) / 1000
                              );
                              // Format as mm:ss
                              return `${minutes
                                .toString()
                                .padStart(2, "0")}:${seconds
                                .toString()
                                .padStart(2, "0")}`;
                            })()}
                            variant="outlined"
                            color="info"
                            sx={{
                              height: "20px",
                              "& .MuiChip-label": {
                                px: 0.5,
                                fontSize: "0.7rem",
                              },
                            }}
                          />
                        </Tooltip>
                      )}

                      <Tooltip title={player.isPaid ? "Paid" : "Not paid"}>
                        <Chip
                          size="small"
                          icon={<PaidIcon style={{ fontSize: "0.8rem" }} />}
                          label={player.isPaid ? "Paid" : "Unpaid"}
                          color={player.isPaid ? "success" : "error"}
                          variant="outlined"
                          sx={{
                            height: "20px",
                            "& .MuiChip-label": {
                              px: 0.5,
                              fontSize: "0.7rem",
                            },
                          }}
                        />
                      </Tooltip>
                    </Stack>
                  </CardContent>

                  {!isReadOnly(player) && (
                    <CardActions sx={{ p: 0.5, justifyContent: "center" }}>
                      <Tooltip title="Come">
                        <IconButton
                          size="small"
                          onClick={() => handleCome(player)}
                          color="success"
                          sx={{ p: 0.5 }}
                        >
                          <PersonIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Pause">
                        <IconButton
                          size="small"
                          onClick={() => handlePause(player)}
                          color="warning"
                          sx={{ p: 0.5 }}
                        >
                          <PauseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Go Home">
                        <IconButton
                          size="small"
                          onClick={() => handleGoHome(player)}
                          color="primary"
                          sx={{ p: 0.5 }}
                        >
                          <HomeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          player.isPaid ? "Mark as Unpaid" : "Mark as Paid"
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() => handlePaid(player)}
                          color={player.isPaid ? "error" : "success"}
                          sx={{ p: 0.5 }}
                        >
                          <PaidIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Menu
        anchorEl={rankMenuAnchorEl}
        open={Boolean(rankMenuAnchorEl)}
        onClose={handleRankMenuClose}
      >
        {rankOptions.map((rank) => (
          <MenuItem
            key={rank}
            onClick={() => handleRankChange(rank)}
            selected={selectedPlayer?.rank === rank}
          >
            <Chip
              size="small"
              label={rank}
              sx={{
                minWidth: "50px",
                bgcolor: rankColor[rank] || rankColor["unknown"],
                color: "white",
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
