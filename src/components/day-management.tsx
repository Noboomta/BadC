import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  EventAvailable as EventAvailableIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useDayContext } from "../providers/day-provider";
import { usePlayerContext } from "../providers/player-provider";
import { useCourtContext } from "../providers/court-provider";
import { useShuttleContext } from "../providers/shuttle-provider";
import moment from "moment";
import { DaySummary, TournamentDay, MatchHistory } from "../types";

export default function DayManagement() {
  const {
    tournamentDays,
    currentDay,
    startNewDay,
    endCurrentDay,
    getDayById,
    exportDayData,
  } = useDayContext();

  const { players, resetPlayersForNewDay } = usePlayerContext();
  const { courts, resetCourtsForNewDay } = useCourtContext();
  const { getShuttleCount } = useShuttleContext();

  const [confirmEndDayOpen, setConfirmEndDayOpen] = useState(false);
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [currentDaySummary, setCurrentDaySummary] = useState<DaySummary | null>(
    null
  );
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

  useEffect(() => {
    if (currentDay) {
      const summary = calculateDaySummary(currentDay);
      setCurrentDaySummary(summary);
    } else {
      setCurrentDaySummary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentDay,
    players,
    courts,
    getShuttleCount,
    exportDayData,
    statsRefreshTrigger,
  ]);

  const handleStartNewDay = async () => {
    console.log("Starting new day...");

    try {
      // Start the new day first
      const newDay = await startNewDay();
      console.log("New day created:", newDay);

      // Force a refresh of the summary stats to ensure they're reset
      setStatsRefreshTrigger((prev) => prev + 1);

      // Then reset players and courts
      await Promise.all([resetPlayersForNewDay(), resetCourtsForNewDay()]);

      console.log("Players and courts reset successfully");
      alert(`Day ${newDay.number} started successfully!`);
    } catch (error: any) {
      console.error("Error starting new day:", error);
      alert("Error starting new day: " + (error?.message || "Unknown error"));
    }
  };

  const handleEndDay = () => {
    console.log("handleEndDay called");

    if (!currentDay?.id) {
      console.error("No current day to end");
      alert("There is no active day to end.");
      setConfirmEndDayOpen(false);
      return;
    }

    console.log("Current day exists, attempting to end day:", currentDay);

    // First close the dialog to avoid UI blocking
    setConfirmEndDayOpen(false);

    // Call endCurrentDay with then/catch handling
    console.log("Calling endCurrentDay...");
    endCurrentDay()
      .then(() => {
        console.log("Day ended successfully");
        alert("Day ended successfully!");
      })
      .catch((error: any) => {
        console.error("Error ending day:", error);
        alert("Error ending day: " + (error?.message || "Unknown error"));
      });
  };

  const handleOpenDayDetails = (dayId: number) => {
    setSelectedDayId(dayId);
    setDayDetailsOpen(true);
  };

  const handleDownloadDayData = (dayId: number) => {
    const dayData = exportDayData(dayId);
    if (!dayData) return;

    const dataStr = JSON.stringify(dayData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `tournament-day-${dayId}-export.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const calculateDaySummary = (day: TournamentDay): DaySummary => {
    // Add try-catch block to handle potential errors in exportDayData
    let dayMatches: MatchHistory[] = [];
    try {
      const dayData = exportDayData(day.id);
      dayMatches = dayData?.matches || [];
    } catch (error) {
      console.error("Error getting day matches:", error);
      dayMatches = [];
    }

    const totalMatches = dayMatches.length;

    // For a brand new day, these lists should be empty as their counters were reset
    const activePlayers = players.filter(
      (p) =>
        p.matchesPlayedByDay &&
        p.matchesPlayedByDay[day.id] &&
        p.matchesPlayedByDay[day.id] > 0
    );

    const activeCourts = courts.filter(
      (c) =>
        c.matchCountByDay &&
        c.matchCountByDay[day.id] &&
        c.matchCountByDay[day.id] > 0
    );

    // If we don't have match data from history, calculate from player and court counts
    const calculatedTotalMatches =
      totalMatches ||
      activeCourts.reduce(
        (sum, court) => sum + (court.matchCountByDay?.[day.id] || 0),
        0
      );

    // For new days, this should start at 0
    const shuttlesUsed = getShuttleCount(day.id);

    // For new days with no matches, this will be 0
    const totalPlayingTime =
      dayMatches.length > 0
        ? dayMatches.reduce((total, match) => {
            if (match.startedTime && match.endedTime) {
              return (
                total +
                Math.floor((match.endedTime - match.startedTime) / 60000)
              );
            }
            return total + 30; // Default to 30 minutes if duration unknown
          }, 0)
        : calculatedTotalMatches * 30; // Fallback to estimating 30 minutes per match

    // Initialize with empty stats for new days
    const playerStats =
      activePlayers.length > 0
        ? activePlayers.reduce((stats, player) => {
            const matchesPlayed = player.matchesPlayedByDay?.[day.id] || 0;

            // Count wins only if we have match data
            const wins =
              dayMatches.length > 0
                ? dayMatches.filter((m) =>
                    m.WinnerPlayersID?.includes(player.id)
                  ).length
                : 0;

            stats[player.id] = {
              matchesPlayed,
              wins,
              losses: matchesPlayed - wins,
            };
            return stats;
          }, {} as DaySummary["playerStats"])
        : {}; // Empty object for new days

    // Initialize with empty stats for new days
    const courtStats =
      activeCourts.length > 0
        ? activeCourts.reduce((stats, court) => {
            const matchesPlayed = court.matchCountByDay?.[day.id] || 0;

            // Calculate usage time only if we have match data
            const totalUsageTime =
              dayMatches.length > 0
                ? dayMatches
                    .filter((m) => m.courtId === court.name)
                    .reduce((total, match) => {
                      if (match.startedTime && match.endedTime) {
                        return (
                          total +
                          Math.floor(
                            (match.endedTime - match.startedTime) / 60000
                          )
                        );
                      }
                      return total + 30;
                    }, 0)
                : matchesPlayed * 30; // Fallback to estimating 30 minutes per match

            stats[court.name] = {
              matchesPlayed,
              totalUsageTime,
            };
            return stats;
          }, {} as DaySummary["courtStats"])
        : {}; // Empty object for new days

    return {
      dayId: day.id,
      dayNumber: day.number,
      date: day.date,
      totalMatches: calculatedTotalMatches,
      totalShuttlesUsed: shuttlesUsed,
      totalPlayingTime,
      playerStats,
      courtStats,
    };
  };

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return "Ongoing";

    const start = moment(startTime);
    const end = moment(endTime);
    const duration = moment.duration(end.diff(start));

    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;

    return `${hours}h ${minutes}m`;
  };

  const selectedDay = selectedDayId ? getDayById(selectedDayId) : null;
  const daySummary = selectedDay ? calculateDaySummary(selectedDay) : null;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <CalendarIcon sx={{ mr: 1 }} />
            Tournament Days
          </Typography>

          {currentDay ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={() => setConfirmEndDayOpen(true)}
            >
              End Current Day
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleStartNewDay}
            >
              Start New Day
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {currentDay && (
          <Card
            elevation={4}
            sx={{
              mb: 3,
              borderLeft: "4px solid #4caf50",
              backgroundColor: "#f1f8e9",
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                sx={{ mb: 1, display: "flex", alignItems: "center" }}
              >
                <EventAvailableIcon sx={{ mr: 1, color: "#4caf50" }} />
                Current Active Day
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Day Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {currentDay.number}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Date
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {moment(currentDay.date).format("MMM DD, YYYY")}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Started At
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {moment(currentDay.startTime).format("hh:mm A")}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Duration
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatDuration(currentDay.startTime, currentDay.endTime)}
                  </Typography>
                </Grid>
              </Grid>

              {currentDaySummary && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">
                        Matches Played
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {currentDaySummary.totalMatches}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">
                        Players Active
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {Object.keys(currentDaySummary.playerStats).length}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">
                        Shuttles Used
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {currentDaySummary.totalShuttlesUsed}
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Typography variant="h6" sx={{ mb: 2 }}>
          Past Tournament Days
        </Typography>

        {tournamentDays.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: "center", py: 3 }}>
            No tournament days recorded yet. Start a new day to begin tracking.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {tournamentDays
              .filter((day) => !day.isActive)
              .sort((a, b) => b.number - a.number)
              .map((day) => (
                <Grid item xs={12} sm={6} md={4} key={day.id}>
                  <Card elevation={2} sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Day {day.number}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 2 }}
                      >
                        {moment(day.date).format("MMM DD, YYYY")}
                      </Typography>
                      <Typography variant="body2">
                        Duration: {formatDuration(day.startTime, day.endTime)}
                      </Typography>
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDayDetails(day.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Data">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleDownloadDayData(day.id)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        )}
      </Paper>

      {/* End Day Confirmation Dialog */}
      <Dialog
        open={confirmEndDayOpen}
        onClose={() => setConfirmEndDayOpen(false)}
        aria-labelledby="end-day-dialog-title"
        disableEnforceFocus={false}
        disableAutoFocus={false}
        disableRestoreFocus={false}
      >
        <DialogTitle id="end-day-dialog-title">
          End Current Tournament Day?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end the current tournament day?
          </Typography>
          <Typography sx={{ mt: 2, color: "warning.main", fontWeight: "bold" }}>
            This will clear all match queues and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEndDayOpen(false)}>Cancel</Button>
          <Button onClick={handleEndDay} variant="contained" color="error">
            End Day
          </Button>
        </DialogActions>
      </Dialog>

      {/* Day Details Dialog */}
      {selectedDay && daySummary && (
        <Dialog
          open={dayDetailsOpen}
          onClose={() => setDayDetailsOpen(false)}
          maxWidth="md"
          fullWidth
          disableEnforceFocus={false}
          disableAutoFocus={false}
          disableRestoreFocus={false}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Day {selectedDay.number} Summary -{" "}
              {moment(selectedDay.date).format("MMM DD, YYYY")}
            </Typography>
            <IconButton onClick={() => setDayDetailsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Duration
                </Typography>
                <Typography>
                  {formatDuration(selectedDay.startTime, selectedDay.endTime)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Matches
                </Typography>
                <Typography>{daySummary.totalMatches}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Shuttles Used
                </Typography>
                <Typography>{daySummary.totalShuttlesUsed}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>
              Court Statistics
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(daySummary.courtStats).map(
                ([courtName, stats]) => (
                  <Grid item xs={12} sm={6} md={4} key={courtName}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {courtName}
                        </Typography>
                        <Typography variant="body2">
                          Matches: {stats.matchesPlayed}
                        </Typography>
                        <Typography variant="body2">
                          Usage: {Math.floor(stats.totalUsageTime / 60)}h{" "}
                          {stats.totalUsageTime % 60}m
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              )}
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Player Statistics
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(daySummary.playerStats)
                .sort((a, b) => b[1].matchesPlayed - a[1].matchesPlayed)
                .slice(0, 9) // Show top 9 players
                .map(([playerId, stats]) => {
                  const player = players.find(
                    (p) => p.id === parseInt(playerId)
                  );
                  return (
                    <Grid item xs={12} sm={6} md={4} key={playerId}>
                      <Card variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {player?.name || `Player ${playerId}`}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Rank: {player?.rank || "Unknown"}
                          </Typography>
                          <Typography variant="body2">
                            Matches: {stats.matchesPlayed}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleDownloadDayData(selectedDay.id)}
              startIcon={<DownloadIcon />}
              color="primary"
            >
              Export Data
            </Button>
            <Button onClick={() => setDayDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}
