import * as React from "react";
import { Suspense, lazy } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { Button, Typography, CircularProgress } from "@mui/material";

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

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
        <Typography variant="h5">Each LocalStorage</Typography>
        <Button
          onClick={() => {
            localStorage.removeItem("playersData");
            localStorage.removeItem("lastedPlayerID");
          }}
        >
          Clear Player LocalStorage
        </Button>
        <Button
          onClick={() => {
            localStorage.removeItem("courtsData");
          }}
        >
          Clear Court LocalStorage
        </Button>
        <Button
          onClick={() => {
            localStorage.removeItem("matchHistories");
          }}
        >
          Clear History LocalStorage
        </Button>
        <Button
          onClick={() => {
            localStorage.removeItem("shuttlesData");
          }}
        >
          Clear Shuttle LocalStorage
        </Button>

        <Typography variant="h5">All LocalStorage</Typography>
        <Button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          Clear LocalStorage
        </Button>
      </CustomTabPanel>
    </Box>
  );
}
