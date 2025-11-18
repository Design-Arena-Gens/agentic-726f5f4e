"use client";
import { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Tabs, Tab } from "@mui/material";
import { getAll, put } from "@/lib/db";
import type { Party } from "@/lib/models";

export default function PartiesPage() {
  const [tab, setTab] = useState(0);
  const [parties, setParties] = useState<Party[]>([]);
  const [form, setForm] = useState<Partial<Party>>({ type: "Customer" });

  useEffect(() => {
    (async () => setParties(await getAll<Party>("parties")))();
  }, []);

  async function save() {
    if (!form.name || !form.type) return;
    const now = Date.now();
    const p: Party = {
      id: crypto.randomUUID(),
      type: form.type,
      name: form.name!,
      address: form.address,
      contact: form.contact,
      email: form.email,
      gstin: form.gstin,
      creditTermsDays: form.creditTermsDays || 0,
      createdAt: now,
      updatedAt: now,
    };
    await put("parties", p);
    setParties(await getAll<Party>("parties"));
    setForm({ type: form.type });
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Parties</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setForm((s) => ({ ...s, type: v === 0 ? "Customer" : "Vendor" })); }}>
          <Tab label="Customers" />
          <Tab label="Vendors" />
        </Tabs>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
          <TextField fullWidth label="Name" value={form.name || ""} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <TextField fullWidth label="Contact" value={form.contact || ""} onChange={(e) => setForm((s) => ({ ...s, contact: e.target.value }))} />
          <TextField fullWidth label="Address" value={form.address || ""} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} sx={{ gridColumn: '1 / -1' }} />
          <TextField fullWidth label="Email" value={form.email || ""} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <TextField fullWidth label="GSTIN" value={form.gstin || ""} onChange={(e) => setForm((s) => ({ ...s, gstin: e.target.value }))} />
          <TextField fullWidth label="Credit Terms (days)" type="number" value={form.creditTermsDays || 0} onChange={(e) => setForm((s) => ({ ...s, creditTermsDays: Number(e.target.value || 0) }))} />
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Button variant="contained" onClick={save}>Save {tab === 0 ? "Customer" : "Vendor"}</Button>
          </Box>
        </Box>
      </Paper>
      <Typography variant="subtitle1" gutterBottom>All Parties</Typography>
      <ul>
        {parties.filter((p) => p.type === (tab === 0 ? "Customer" : "Vendor")).map((p) => (
          <li key={p.id}>{p.name} {p.gstin ? `(GSTIN: ${p.gstin})` : ""}</li>
        ))}
      </ul>
    </Box>
  );
}
