"use client";
import { PropsWithChildren } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/theme";
import LayoutShell from "@/components/LayoutShell";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LayoutShell>{children}</LayoutShell>
    </ThemeProvider>
  );
}
