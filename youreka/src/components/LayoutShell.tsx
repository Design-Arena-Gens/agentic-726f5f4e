"use client";
import { PropsWithChildren, useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleIcon from "@mui/icons-material/People";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/journal", label: "Journal", icon: <ReceiptLongIcon /> },
  { href: "/parties", label: "Parties", icon: <PeopleIcon /> },
  { href: "/inventory", label: "Inventory", icon: <Inventory2Icon /> },
  { href: "/invoicing", label: "Invoicing", icon: <RequestQuoteIcon /> },
  { href: "/reports", label: "Reports", icon: <AssessmentIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

export default function LayoutShell({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpen(true)} aria-label="Open navigation menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            YOUREKA by QUAZENTA
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box role="navigation" aria-label="Main navigation" sx={{ width: 280 }}>
          <List>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} style={{ color: "inherit", textDecoration: "none" }}>
                <ListItemButton onClick={() => setOpen(false)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </Link>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>{children}</Box>
    </Box>
  );
}
