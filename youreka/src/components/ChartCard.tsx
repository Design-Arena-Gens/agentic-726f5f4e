"use client";
import { Card, CardHeader, CardContent } from "@mui/material";
import { Bar, Line, Pie } from "react-chartjs-2";
import type { ChartData } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

export type ChartType = "bar" | "line" | "pie";

export default function ChartCard({
  title,
  type,
  data,
  ariaLabel,
}: {
  title: string;
  type: ChartType;
  data: unknown;
  ariaLabel?: string;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        {type === "bar" && <Bar aria-label={ariaLabel || title} data={data as ChartData<'bar'>} />}
        {type === "line" && <Line aria-label={ariaLabel || title} data={data as ChartData<'line'>} />}
        {type === "pie" && <Pie aria-label={ariaLabel || title} data={data as ChartData<'pie'>} />}
      </CardContent>
    </Card>
  );
}
