"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Button, TextField } from "@mui/material";
import { getAll } from "@/lib/db";
import type { Account, JournalEntry } from "@/lib/models";
import { computeProfitAndLoss, computeTrialBalance } from "@/lib/reports";
import dayjs from "dayjs";

function download(filename: string, text: string) {
  const e = document.createElement("a");
  e.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(text));
  e.setAttribute("download", filename);
  e.style.display = "none";
  document.body.appendChild(e);
  e.click();
  document.body.removeChild(e);
}

export default function ReportsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [from, setFrom] = useState(dayjs().startOf("year").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    (async () => {
      setAccounts(await getAll<Account>("accounts"));
      setJournal(await getAll<JournalEntry>("journal"));
    })();
  }, []);

  const filtered = useMemo(
    () => journal.filter((j) => j.date >= from && j.date <= to),
    [journal, from, to]
  );

  const pnl = useMemo(() => computeProfitAndLoss(accounts, filtered), [accounts, filtered]);
  const tb = useMemo(() => computeTrialBalance(accounts, filtered), [accounts, filtered]);

  function exportTrialBalanceCsv() {
    const rows = [
      ["Account", "Debit", "Credit"],
      ...tb.map((r) => [r.name, r.debit.toFixed(2), r.credit.toFixed(2)]),
    ];
    download(`trial-balance-${from}-to-${to}.csv`, rows.map((r) => r.join(",")).join("\n"));
  }

  function exportPnLCsv() {
    const rows = [
      ["Revenue", pnl.revenue.toFixed(2)],
      ["Expenses", pnl.expenses.toFixed(2)],
      ["Profit", pnl.profit.toFixed(2)],
    ];
    download(`pnl-${from}-to-${to}.csv`, rows.map((r) => r.join(",")).join("\n"));
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Reports</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <TextField fullWidth type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField fullWidth type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button fullWidth variant="outlined" onClick={exportTrialBalanceCsv}>Download Trial Balance CSV</Button>
          <Button fullWidth variant="outlined" onClick={exportPnLCsv}>Download P&L CSV</Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Profit & Loss</Typography>
          <Typography>Revenue: ? {pnl.revenue.toFixed(2)}</Typography>
          <Typography>Expenses: ? {pnl.expenses.toFixed(2)}</Typography>
          <Typography variant="h6">Profit: ? {pnl.profit.toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Trial Balance</Typography>
          <ul>
            {tb.map((r) => (
              <li key={r.accountId}>{r.name}: Dr {r.debit.toFixed(2)} / Cr {r.credit.toFixed(2)}</li>
            ))}
          </ul>
        </Paper>
      </Box>
    </Box>
  );
}
