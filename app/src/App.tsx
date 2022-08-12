import React from "react";
import { Box, CssBaseline, Paper, Typography } from "@mui/material";

function App() {
  return (
    <div>
      <CssBaseline />
      <Box
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        <Paper
          elevation={3}
          sx={{ padding: "1rem", backgroundColor: "secondary.light" }}
        >
          <Typography color="primary.dark" variant="h1">
            Hello Fedemail!
          </Typography>
        </Paper>
      </Box>
    </div>
  );
}

export default App;
