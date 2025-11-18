"use client";
import { createTheme } from "@mui/material/styles";
import { red, green, blue, grey } from "@mui/material/colors";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: blue[700] },
    secondary: { main: green[600] },
    error: { main: red.A400 },
    background: { default: grey[50] },
  },
  typography: {
    fontFamily: [
      "Roboto",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
  },
  spacing: 8,
  shape: { borderRadius: 8 },
});

export default theme;
