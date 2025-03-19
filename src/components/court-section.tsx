import { useState } from "react";
import { Button, Typography, Box, TextField } from "@mui/material";
import { useCourtContext } from "../providers/court-provider";
import { statusColors } from "../constant";

export default function CourtSection() {
  const { courts, addCourt } = useCourtContext();
  const [courtName, setCourtName] = useState("");

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
          {court.name} - {court.status} (Matches: {court.matchCount})
        </Box>
      ))}
    </Box>
  );
}
