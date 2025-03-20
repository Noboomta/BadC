import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import CourtProvider from "../providers/court-provider";
import PlayerProvider from "../providers/player-provider";
import ShuttleProvider from "../providers/shuttle-provider";
import HistoryProvider from "../providers/history-provider";
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PlayerProvider>
        <CourtProvider>
          <ShuttleProvider>
            <HistoryProvider>
              <Container>
                <Typography my={2} variant="h4" gutterBottom>
                  Badminton Management
                </Typography>
                <BasicTabs />
              </Container>
            </HistoryProvider>
          </ShuttleProvider>
        </CourtProvider>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default Badminton;
