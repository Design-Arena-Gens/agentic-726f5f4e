"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, TextField, Button, Autocomplete, Paper, Divider } from "@mui/material";
import DataTable from "@/components/DataTable";
import { getAll, put } from "@/lib/db";
import type { Account, JournalEntry, JournalLine } from "@/lib/models";
import dayjs from "dayjs";
import { isBalanced } from "@/lib/accounting";

export default function JournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [narration, setNarration] = useState("");
  const [line1, setLine1] = useState<{ accountId?: string; debit: number; credit: number }>({ debit: 0, credit: 0 });
  const [line2, setLine2] = useState<{ accountId?: string; debit: number; credit: number }>({ debit: 0, credit: 0 });
  const balanced = useMemo(() => {
    const lines: JournalLine[] = [];
    if (line1.accountId) lines.push({ accountId: line1.accountId, debit: line1.debit || 0, credit: line1.credit || 0 });
    if (line2.accountId) lines.push({ accountId: line2.accountId, debit: line2.debit || 0, credit: line2.credit || 0 });
    if (lines.length < 2) return false;
    return isBalanced(lines);
  }, [line1, line2]);

  useEffect(() => {
    (async () => {
      setAccounts(await getAll<Account>("accounts"));
      setEntries(await getAll<JournalEntry>("journal"));
    })();
  }, []);

  async function addEntry() {
    if (!line1.accountId || !line2.accountId || !balanced) return;
    const je: JournalEntry = {
      id: crypto.randomUUID(),
      date,
      narration,
      lines: [
        { accountId: line1.accountId, debit: line1.debit || 0, credit: line1.credit || 0 },
        { accountId: line2.accountId, debit: line2.debit || 0, credit: line2.credit || 0 },
      ],
      createdAt: Date.now(),
    };
    await put("journal", je);
    setEntries(await getAll<JournalEntry>("journal"));
    setNarration("");
    setLine1({ debit: 0, credit: 0 });
    setLine2({ debit: 0, credit: 0 });
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Journal Entries
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 2 }}>
          <TextField fullWidth label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField fullWidth label="Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 2 }}>
          <Autocomplete
            options={accounts}
            getOptionLabel={(a) => `${a.code} - ${a.name}`}
            renderInput={(params) => <TextField {...params} label="Line 1 Account" />}
            value={accounts.find((a) => a.id === line1.accountId) || null}
            onChange={(_, v) => setLine1((s) => ({ ...s, accountId: v?.id }))}
          />
          <TextField label="Debit" type="number" fullWidth value={line1.debit} onChange={(e) => setLine1((s) => ({ ...s, debit: Number(e.target.value || 0) }))} />
          <TextField label="Credit" type="number" fullWidth value={line1.credit} onChange={(e) => setLine1((s) => ({ ...s, credit: Number(e.target.value || 0) }))} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 2, mt: 2 }}>
          <Autocomplete
            options={accounts}
            getOptionLabel={(a) => `${a.code} - ${a.name}`}
            renderInput={(params) => <TextField {...params} label="Line 2 Account" />}
            value={accounts.find((a) => a.id === line2.accountId) || null}
            onChange={(_, v) => setLine2((s) => ({ ...s, accountId: v?.id }))}
          />
          <TextField label="Debit" type="number" fullWidth value={line2.debit} onChange={(e) => setLine2((s) => ({ ...s, debit: Number(e.target.value || 0) }))} />
          <TextField label="Credit" type="number" fullWidth value={line2.credit} onChange={(e) => setLine2((s) => ({ ...s, credit: Number(e.target.value || 0) }))} />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" disabled={!balanced} onClick={addEntry} aria-label="Add journal entry">Add Entry</Button>
        </Box>
      </Paper>

      <DataTable
        rows={entries.sort((a, b) => a.date.localeCompare(b.date))}
        columns={[
          { id: "date", label: "Date" },
          { id: "narration", label: "Narration" },
          {
            id: "amount",
            label: "Amount",
            format: (_, row) => {
              const amt = row.lines.reduce((s, l) => s + l.debit, 0);
              return `? ${amt.toFixed(2)}`;
            },
          },
        ]}
      />
    </Box>
  );
}
