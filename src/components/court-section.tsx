import { useState } from "react";
import {
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  Card,
  CardContent,
  CardActions,
  Divider,
} from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { statusColors } from "../constant";
import { Court } from "../types";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export default function CourtSection() {
  const { courts, addCourt, updateCourt, deleteCourt } = useCourtContext();
  const { getPlayerNameByID } = usePlayerContext();
  const [courtName, setCourtName] = useState("");

  const isPuasable = (court: Court) => {
    return court.status === "available" && court.currentMatch === null;
  };

  const isResumable = (court: Court) => {
    return court.status === "pause";
  };

  const handlePause = (court: Court) => {
    updateCourt(court.name, {
      status: "pause",
    });
  };

  const handleResume = (court: Court) => {
    updateCourt(court.name, {
      status: "available",
    });
  };

  const isDeletable = (court: Court) => {
    return court.status !== "using";
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Court Management
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "flex-end" }}>
        <TextField
          label="Court Name"
          value={courtName}
          onChange={(e) => setCourtName(e.target.value)}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          onClick={() => {
            if (courtName.trim() === "") {
              alert("Court name cannot be empty");
              return;
            }
            addCourt(courtName);
            setCourtName("");
          }}
        >
          Add Court
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {courts.map((court, index) => (
          <Card
            key={index}
            variant="outlined"
            sx={{
              width: 280,
              borderLeftWidth: 8,
              borderLeftColor: statusColors[court.status],
              transition: "all 0.2s",
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">{court.name}</Typography>
                {isDeletable(court) && (
                  <Tooltip title="Delete Court">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteCourt(court.name)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              <Stack spacing={1}>
                <Typography variant="body2">
                  Status:{" "}
                  <span
                    style={{
                      color: statusColors[court.status],
                      fontWeight: "bold",
                    }}
                  >
                    {court.status.toUpperCase()}
                  </span>
                </Typography>

                <Typography variant="body2">
                  Matches played: <strong>{court.matchCount}</strong>
                </Typography>

                {court.status === "using" && court.currentMatch && (
                  <>
                    <Typography variant="body2" fontWeight="medium">
                      Current Match:
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        bgcolor: "#f5f5f5",
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {court.currentMatch.leftSidePlayersID
                          .map((id) => getPlayerNameByID(id))
                          .join(", ")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        vs
                      </Typography>
                      <Typography variant="body2">
                        {court.currentMatch.rightSidePlayersID
                          .map((id) => getPlayerNameByID(id))
                          .join(", ")}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>

            <CardActions sx={{ justifyContent: "flex-end" }}>
              {isPuasable(court) && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<PauseIcon />}
                  onClick={() => handlePause(court)}
                >
                  Pause
                </Button>
              )}

              {isResumable(court) && (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleResume(court)}
                >
                  Resume
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
