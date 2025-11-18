"use client";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, TableContainer, Paper } from "@mui/material";

export interface Column<T extends { id: string }> {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (value: T[keyof T], row: T) => React.ReactNode;
}

export default function DataTable<T extends { id: string }>({ rows, columns, orderBy, order, onSort }: {
  rows: T[];
  columns: Column<T>[];
  orderBy?: string;
  order?: "asc" | "desc";
  onSort?: (columnId: string) => void;
}) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="data table">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={String(c.id)} align={c.align || "left"}>
                {onSort ? (
                  <TableSortLabel active={orderBy === c.id} direction={orderBy === c.id ? order : "asc"} onClick={() => onSort(String(c.id))}>
                    {c.label}
                  </TableSortLabel>
                ) : (
                  c.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              {columns.map((c) => {
                const rec = row as unknown as Record<string, unknown>;
                const value = rec[c.id] as unknown as T[keyof T];
                return <TableCell key={String(c.id)} align={c.align || "left"}>{c.format ? c.format(value, row) : (value as React.ReactNode)}</TableCell>;
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
