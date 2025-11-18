"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Chip } from "@mui/material";
import ChartCard from "@/components/ChartCard";
import { getAll, seedDefaults } from "@/lib/db";
import type { Account, JournalEntry, Invoice } from "@/lib/models";
import { computeProfitAndLoss } from "@/lib/reports";
import dayjs from "dayjs";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    seedDefaults().then(async () => {
      setAccounts(await getAll<Account>("accounts"));
      setJournal(await getAll<JournalEntry>("journal"));
      setInvoices(await getAll<Invoice>("invoices"));
    });
  }, []);

  const pnl = useMemo(() => computeProfitAndLoss(accounts, journal), [accounts, journal]);

  const invoicesByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      const m = dayjs(inv.date).format("YYYY-MM");
      map.set(m, (map.get(m) || 0) + inv.grandTotal);
    }
    const labels = Array.from(map.keys()).sort();
    const data = labels.map((l) => map.get(l) || 0);
    return { labels, data };
  }, [invoices]);

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="overline">Revenue</Typography>
            <Typography variant="h5" color="primary.main">? {pnl.revenue.toFixed(2)}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline">Expenses</Typography>
            <Typography variant="h5" color="error.main">? {pnl.expenses.toFixed(2)}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline">Profit</Typography>
            <Typography variant="h5" color={pnl.profit >= 0 ? 'secondary.main' : 'error.main'}>? {pnl.profit.toFixed(2)}</Typography>
            <Chip size="small" sx={{ mt: 1 }} color={pnl.profit >= 0 ? 'success' : 'error'} label={pnl.profit >= 0 ? 'Positive' : 'Negative'} />
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ChartCard
          title="Invoice Revenue by Month"
          type="line"
          data={{
            labels: invoicesByMonth.labels,
            datasets: [
              {
                label: 'Revenue',
                data: invoicesByMonth.data,
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
              },
            ],
          }}
        />
        <ChartCard
          title="Revenue vs Expenses"
          type="bar"
          data={{
            labels: ['Revenue', 'Expenses'],
            datasets: [
              {
                label: 'Amount',
                data: [pnl.revenue, pnl.expenses],
                backgroundColor: ['#2e7d32', '#d32f2f'],
              },
            ],
          }}
        />
      </Box>
    </Box>
  );
}
