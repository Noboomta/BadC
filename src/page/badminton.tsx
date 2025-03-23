import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import CourtProvider from "../providers/court-provider";
import PlayerProvider from "../providers/player-provider";
import ShuttleProvider from "../providers/shuttle-provider";
import HistoryProvider from "../providers/history-provider";
import QueueProvider from "../providers/queue-provider";
import BasicTabs from "../components/tab-basic";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    success: { main: "#4caf50" },
  },
  typography: {
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
  },
});

function Badminton() {
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    // Check for localStorage flag set by App.tsx after reset
    const justReset = sessionStorage.getItem("justReset");
    if (justReset) {
      setResetNotice(true);
      // Remove the flag after showing notification
      sessionStorage.removeItem("justReset");
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PlayerProvider>
        <CourtProvider>
          <ShuttleProvider>
            <HistoryProvider>
              <QueueProvider>
                <Container>
                  <Typography my={2} variant="h4" gutterBottom>
                    Badminton Management
                  </Typography>
                  <BasicTabs />

                  <Snackbar
                    open={resetNotice}
                    autoHideDuration={6000}
                    onClose={() => setResetNotice(false)}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                  >
                    <Alert
                      onClose={() => setResetNotice(false)}
                      severity="success"
                      variant="filled"
                      sx={{ width: "100%" }}
                    >
                      All data has been reset successfully!
                    </Alert>
                  </Snackbar>
                </Container>
              </QueueProvider>
            </HistoryProvider>
          </ShuttleProvider>
        </CourtProvider>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default Badminton;
