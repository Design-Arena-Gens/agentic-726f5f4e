"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Chip } from "@mui/material";
import { getAll, put } from "@/lib/db";
import type { Item, Warehouse, StockLedgerEntry } from "@/lib/models";

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stock, setStock] = useState<StockLedgerEntry[]>([]);

  const [itemForm, setItemForm] = useState<Partial<Item>>({});
  const [whForm, setWhForm] = useState<Partial<Warehouse>>({});

  useEffect(() => {
    (async () => {
      setItems(await getAll<Item>("items"));
      setWarehouses(await getAll<Warehouse>("warehouses"));
      setStock(await getAll<StockLedgerEntry>("stockLedger"));
    })();
  }, []);

  const qtyByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stock) {
      map.set(s.itemId, (map.get(s.itemId) || 0) + s.deltaQty);
    }
    return map;
  }, [stock]);

  async function saveItem() {
    if (!itemForm.sku || !itemForm.name || itemForm.unitPrice == null) return;
    const now = Date.now();
    const item: Item = {
      id: crypto.randomUUID(),
      sku: itemForm.sku!,
      name: itemForm.name!,
      description: itemForm.description,
      unitPrice: Number(itemForm.unitPrice),
      reorderPoint: itemForm.reorderPoint ? Number(itemForm.reorderPoint) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await put("items", item);
    setItems(await getAll<Item>("items"));
    setItemForm({});
  }

  async function saveWarehouse() {
    if (!whForm.name) return;
    const now = Date.now();
    const wh: Warehouse = { id: crypto.randomUUID(), name: whForm.name!, address: whForm.address, createdAt: now, updatedAt: now };
    await put("warehouses", wh);
    setWarehouses(await getAll<Warehouse>("warehouses"));
    setWhForm({});
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Inventory</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Add Item</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField fullWidth label="SKU" value={itemForm.sku || ""} onChange={(e) => setItemForm((s) => ({ ...s, sku: e.target.value }))} />
            <TextField fullWidth label="Name" value={itemForm.name || ""} onChange={(e) => setItemForm((s) => ({ ...s, name: e.target.value }))} />
            <TextField fullWidth label="Description" value={itemForm.description || ""} onChange={(e) => setItemForm((s) => ({ ...s, description: e.target.value }))} sx={{ gridColumn: '1 / -1' }} />
            <TextField fullWidth type="number" label="Unit Price" value={itemForm.unitPrice || ""} onChange={(e) => setItemForm((s) => ({ ...s, unitPrice: Number(e.target.value || 0) }))} />
            <TextField fullWidth type="number" label="Reorder Point" value={itemForm.reorderPoint || ""} onChange={(e) => setItemForm((s) => ({ ...s, reorderPoint: Number(e.target.value || 0) }))} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Button variant="contained" onClick={saveItem}>Save Item</Button>
            </Box>
          </Box>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Add Warehouse</Typography>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Name" value={whForm.name || ""} onChange={(e) => setWhForm((s) => ({ ...s, name: e.target.value }))} />
            <TextField fullWidth label="Address" value={whForm.address || ""} onChange={(e) => setWhForm((s) => ({ ...s, address: e.target.value }))} />
            <Button variant="contained" onClick={saveWarehouse}>Save Warehouse</Button>
          </Box>
        </Paper>
      </Box>

      <Typography variant="subtitle1" mt={3}>Items</Typography>
      <ul>
        {items.map((it) => {
          const qty = qtyByItem.get(it.id) || 0;
          const low = it.reorderPoint != null && qty <= it.reorderPoint;
          return (
            <li key={it.id}>
              {it.sku} - {it.name} ? Qty: {qty} {low && <Chip color="warning" size="small" label="Low Stock"/>}
            </li>
          );
        })}
      </ul>

      <Typography variant="subtitle1" mt={2}>Warehouses</Typography>
      <ul>
        {warehouses.map((w) => (
          <li key={w.id}>{w.name}</li>
        ))}
      </ul>
    </Box>
  );
}
