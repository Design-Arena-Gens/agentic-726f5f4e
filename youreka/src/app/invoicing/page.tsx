"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Autocomplete } from "@mui/material";
import { getAll, put } from "@/lib/db";
import type { Party, Item, Invoice, InvoiceLine, SettingsProfile, Warehouse, JournalEntry, StockLedgerEntry } from "@/lib/models";
import dayjs from "dayjs";
import { calculateInvoiceTotals, makeInvoiceJournal } from "@/lib/accounting";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InvoicingPage() {
  const [customers, setCustomers] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [number, setNumber] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [customer, setCustomer] = useState<Party | null>(null);
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([]);

  useEffect(() => {
    (async () => {
      const ps = (await getAll<Party>("parties")).filter((p) => p.type === "Customer");
      setCustomers(ps);
      setItems(await getAll<Item>("items"));
      const [p] = await getAll<SettingsProfile>("settings");
      setProfile(p || null);
      setWarehouses(await getAll<Warehouse>("warehouses"));
      // accounts not needed directly here
    })();
  }, []);

  function addLine() {
    setLines((s) => [...s, { itemId: items[0]?.id || "", quantity: 1, unitPrice: items[0]?.unitPrice || 0 } as InvoiceLine]);
  }

  const totals = useMemo(() => calculateInvoiceTotals(lines), [lines]);

  async function saveInvoice() {
    if (!customer || !number) return;
    const inv: Invoice = {
      id: crypto.randomUUID(),
      number,
      date,
      customerId: customer.id,
      billingAddress,
      shippingAddress,
      lines,
      subTotal: totals.subTotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      createdAt: Date.now(),
    };
    await put("invoices", inv);

    // Post journal entry
    const d = profile?.defaultAccounts;
    if (d && d.accountsReceivableId && d.salesRevenueId && d.inventoryAssetId && d.costOfGoodsSoldId && d.cashId) {
      const je: JournalEntry = {
        id: crypto.randomUUID(),
        date,
        reference: inv.number,
        lines: makeInvoiceJournal(inv, {
          accountsReceivableId: d.accountsReceivableId,
          salesRevenueId: d.salesRevenueId,
          inventoryAssetId: d.inventoryAssetId,
          costOfGoodsSoldId: d.costOfGoodsSoldId,
          cashId: d.cashId,
        }, false),
        createdAt: Date.now(),
      };
      await put("journal", je);
    }

    // Reduce inventory quantities (simple: take from first warehouse)
    const wh = warehouses[0];
    if (wh) {
      for (const l of lines) {
        const sle: StockLedgerEntry = {
          id: crypto.randomUUID(),
          itemId: l.itemId,
          warehouseId: wh.id,
          deltaQty: -Math.abs(l.quantity),
          reference: inv.number,
          date,
        };
        await put("stockLedger", sle);
      }
    }

    // Generate PDF
    generatePdf(inv);

    // Reset form
    setNumber("");
    setCustomer(null);
    setBillingAddress("");
    setShippingAddress("");
    setLines([]);
  }

  function generatePdf(inv: Invoice) {
    const doc = new jsPDF();
    const firm = profile?.firmName || "Your Firm";
    if (profile?.logoDataUrl) {
      try { doc.addImage(profile.logoDataUrl, "PNG", 10, 10, 30, 30); } catch {}
    }
    doc.setFontSize(16);
    doc.text(firm, 50, 20);
    doc.setFontSize(10);
    if (profile?.gstin) doc.text(`GSTIN: ${profile.gstin}`, 50, 26);
    if (profile?.address) doc.text(profile.address, 50, 32);

    doc.setFontSize(14);
    doc.text(`Invoice #${inv.number}`, 10, 50);
    doc.setFontSize(10);
    doc.text(`Date: ${inv.date}`, 10, 56);
    const custName = customers.find((c) => c.id === inv.customerId)?.name || "";
    doc.text(`Bill To: ${custName}`, 10, 62);

    autoTable(doc, {
      startY: 70,
      head: [["Item", "Qty", "Unit Price", "Discount", "Tax %", "Amount"]],
      body: inv.lines.map((l) => {
        const item = items.find((i) => i.id === l.itemId);
        const amount = l.quantity * l.unitPrice - (l.discount || 0) + ((Math.max(0, l.quantity * l.unitPrice - (l.discount || 0)) * (l.taxRate || 0)) / 100);
        return [item?.name || l.description || "Item", String(l.quantity), String(l.unitPrice), String(l.discount || 0), String(l.taxRate || 0), amount.toFixed(2)];
      }),
    });

    const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    const y = (last?.finalY ?? 120) + 6;
    doc.text(`Subtotal: ? ${inv.subTotal.toFixed(2)}`, 140, y);
    doc.text(`Discount: ? ${inv.discountTotal.toFixed(2)}`, 140, y + 6);
    doc.text(`Tax: ? ${inv.taxTotal.toFixed(2)}`, 140, y + 12);
    doc.text(`Total: ? ${inv.grandTotal.toFixed(2)}`, 140, y + 18);

    doc.save(`invoice-${inv.number}.pdf`);
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Invoicing</Typography>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr 2fr 3fr' }, gap: 2 }}>
          <TextField fullWidth label="Invoice Number" value={number} onChange={(e) => setNumber(e.target.value)} />
          <TextField fullWidth type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Autocomplete
            options={customers}
            getOptionLabel={(c) => c.name}
            renderInput={(p) => <TextField {...p} label="Customer" />}
            value={customer}
            onChange={(_, v) => setCustomer(v)}
          />
          <TextField fullWidth label="Billing Address" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} sx={{ gridColumn: '1 / -1' }} />
          <TextField fullWidth label="Shipping Address" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} sx={{ gridColumn: '1 / -1' }} />
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle1">Items</Typography>
          {lines.map((l, idx) => (
            <Box key={`line-${idx}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr 1fr 1fr 1fr' }, gap: 2, mt: 1 }}>
              <Autocomplete
                options={items}
                getOptionLabel={(i) => `${i.sku} - ${i.name}`}
                renderInput={(p) => <TextField {...p} label="Item" />}
                value={items.find((i) => i.id === l.itemId) || null}
                onChange={(_, v) => setLines((s) => s.map((x, i) => (i === idx ? { ...x, itemId: v?.id || '' } : x)))}
              />
              <TextField fullWidth type="number" label="Qty" value={l.quantity} onChange={(e) => setLines((s) => s.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value || 0) } : x)))} />
              <TextField fullWidth type="number" label="Unit Price" value={l.unitPrice} onChange={(e) => setLines((s) => s.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value || 0) } : x)))} />
              <TextField fullWidth type="number" label="Discount" value={l.discount || 0} onChange={(e) => setLines((s) => s.map((x, i) => (i === idx ? { ...x, discount: Number(e.target.value || 0) } : x)))} />
              <TextField fullWidth type="number" label="Tax %" value={l.taxRate || 0} onChange={(e) => setLines((s) => s.map((x, i) => (i === idx ? { ...x, taxRate: Number(e.target.value || 0) } : x)))} />
            </Box>
          ))}
          <Box mt={1}><Button variant="outlined" onClick={addLine}>Add Line</Button></Box>
        </Box>

        <Box sx={{ textAlign: 'right', mt: 2 }}>
          <Typography>Subtotal: ? {totals.subTotal.toFixed(2)}</Typography>
          <Typography>Discount: ? {totals.discountTotal.toFixed(2)}</Typography>
          <Typography>Tax: ? {totals.taxTotal.toFixed(2)}</Typography>
          <Typography variant="h6">Total: ? {totals.grandTotal.toFixed(2)}</Typography>
        </Box>

        <Box mt={2}><Button variant="contained" onClick={saveInvoice}>Save & Download PDF</Button></Box>
      </Paper>
    </Box>
  );
}
