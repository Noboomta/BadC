import * as React from "react";
import { Suspense, lazy, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import {
  Button,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Stack,
  Alert,
  Snackbar,
} from "@mui/material";
import { usePlayerContext } from "../providers/player-provider";
import { useCourtContext } from "../providers/court-provider";
import { useQueueContext } from "../providers/queue-provider";
import { useShuttleContext } from "../providers/shuttle-provider";

// Lazy load components
const PlayerSection = lazy(() => import("./player-section"));
const MatchSection = lazy(() => import("./match-section"));
const SummarySection = lazy(() => import("./summary-section"));
const CourtSection = lazy(() => import("./court-section"));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          <Suspense
            fallback={
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            }
          >
            {children}
          </Suspense>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs() {
  const [value, setValue] = React.useState(0);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { resetAllPlayersStats } = usePlayerContext();
  const { courts, setCourts } = useCourtContext();
  const { clearQueue } = useQueueContext();
  const { clearShuttles } = useShuttleContext();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleResetPlayerStats = async () => {
    if (
      confirm(
        "Are you sure you want to reset all player stats? This will:\n\n1. Change all players to offline status\n2. Reset wait times and history\n3. Keep player ranks and names\n4. Reset all courts to available and clear ongoing matches\n5. Clear the match queue\n6. Reset court match counters to zero\n7. Clear all shuttles used\n8. Reset match history\n9. Remove all matches from the queue"
      )
    ) {
      try {
        // Reset player stats
        await resetAllPlayersStats();

        // Reset courts - set all to available, clear current matches, and reset matchCount
        setCourts(
          courts.map((court) => ({
            ...court,
            status: "available",
            currentMatch: null,
            matchCount: 0,
          }))
        );

        // Clear the match queue
        clearQueue();

        // Clear all shuttles
        clearShuttles();

        // Clear match history
        localStorage.removeItem("matchHistories5");

        // Clear queue data from localStorage
        localStorage.removeItem("queueData5");
        localStorage.removeItem("queueCounter5");

        // Reload the page to refresh all state
        window.location.reload();

        setResetSuccess(true);
      } catch (error) {
        console.error("Error resetting player stats and courts:", error);
        alert("Error resetting player stats and courts");
      }
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Player" {...a11yProps(0)} />
          <Tab label="Court" {...a11yProps(1)} />
          <Tab label="Match" {...a11yProps(2)} />
          <Tab label="Summary" {...a11yProps(3)} />
          <Tab label="Setting" {...a11yProps(4)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <PlayerSection />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <CourtSection />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <MatchSection />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <SummarySection />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={4}>
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Reset Player Stats
          </Typography>
          <Typography variant="body1" paragraph>
            This will:
            <ol>
              <li>Reset all player statuses to "offline"</li>
              <li>Clear individual player history</li>
              <li>Reset waiting times and timestamps</li>
              <li>Keep player names and ranks</li>
              <li>Reset all courts to "available" and clear ongoing matches</li>
              <li>Clear the match queue</li>
              <li>Reset court match counters to zero</li>
              <li>Clear all shuttles used</li>
              <li>Clear match history</li>
              <li>Remove all matches from the queue</li>
            </ol>
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResetPlayerStats}
            sx={{ mt: 2 }}
          >
            Reset Player Stats
          </Button>
        </Paper>

        <Divider sx={{ my: 3 }} />

        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="error">
            Danger Zone
          </Typography>
          <Typography variant="h6">Clear Storage</Typography>
          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: 2, flexWrap: "wrap", gap: 2 }}
          >
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                localStorage.removeItem("playersData5");
                localStorage.removeItem("lastedPlayerID5");
              }}
            >
              Clear Player LocalStorage
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                localStorage.removeItem("courtsData5");
              }}
            >
              Clear Court LocalStorage
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                localStorage.removeItem("matchHistories5");
              }}
            >
              Clear History LocalStorage
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                localStorage.removeItem("shuttlesData5");
              }}
            >
              Clear Shuttle LocalStorage
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                localStorage.removeItem("queueData5");
                localStorage.removeItem("queueCounter5");
              }}
            >
              Clear Queue LocalStorage
            </Button>
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to clear ALL data? This cannot be undone."
                  )
                ) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Clear All LocalStorage
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={resetSuccess}
          autoHideDuration={6000}
          onClose={() => setResetSuccess(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setResetSuccess(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            All player stats have been reset successfully!
          </Alert>
        </Snackbar>
      </CustomTabPanel>
    </Box>
  );
}
