import { useState } from "react";
import { Button, Typography, Box, TextField } from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { usePlayerContext } from "../providers/player-provider";
import { statusColors } from "../constant";
import { Court } from "../types";

export default function CourtSection() {
  const { courts, addCourt, updateCourt } = useCourtContext();
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

  return (
    <Box>
      <Typography variant="h5">Courts</Typography>
      <TextField
        label="Court Name"
        value={courtName}
        onChange={(e) => setCourtName(e.target.value)}
      />
      <Button
        sx={{ m: 2 }}
        variant="contained"
        onClick={() => {
          addCourt(courtName);
          setCourtName("");
        }}
      >
        Add Court
      </Button>
      {courts.map((court, index) => (
        <Box
          key={index}
          sx={{
            backgroundColor: statusColors[court.status],
            padding: 1,
            margin: 1,
          }}
        >
          {court.name} - {court.status} (Used: {court.matchCount})
          {isPuasable(court) ? (
            <>
              <Button onClick={() => handlePause(court)}>Pause</Button>
            </>
          ) : null}
          {isResumable(court) ? (
            <>
              <Button onClick={() => handleResume(court)}>resume</Button>
            </>
          ) : null}
          {court.status === "using" ? (
            <>
              <Typography variant="body1">
                [ {court.currentMatch?.leftSidePlayersID
                  .map((id) => getPlayerNameByID(id))
                  .join(", ")}
                {" ] Vs [ "}
                {court.currentMatch?.rightSidePlayersID
                  .map((id) => getPlayerNameByID(id))
                  .join(", ")} ]
              </Typography>
            </>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}
