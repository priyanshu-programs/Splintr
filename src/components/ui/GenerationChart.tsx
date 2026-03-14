"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", light: 6, medium: 6, dark: 4 },
  { day: "Tue", light: 9, medium: 8, dark: 3 },
  { day: "Wed", light: 12, medium: 10, dark: 7 },
  { day: "Thu", light: 13, medium: 13, dark: 5 },
  { day: "Fri", light: 9, medium: 6, dark: 2 },
  { day: "Sat", light: 3, medium: 3, dark: 1 },
  { day: "Sun", light: 12, medium: 11, dark: 6 },
];

export default function GenerationChart() {
  const [period, setPeriod] = useState("LAST 7 DAYS");

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-[15px] text-[var(--sp-fg)]">
          Generation Throughput
        </h2>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none bg-background border border-foreground/5 text-[10px] font-mono font-bold text-[#6A6D75] uppercase tracking-wider py-1.5 pl-3 pr-8 rounded focus:outline-none focus:ring-1 focus:ring-black/10 transition-shadow cursor-pointer"
          >
            <option>LAST 7 DAYS</option>
            <option>LAST 30 DAYS</option>
            <option>LAST 90 DAYS</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#6A6D75]">
            <svg
              className="fill-current h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] -ml-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f3f4f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f3f4f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A0A0C" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0A0A0C" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#f3f4f6"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
              ticks={[0, 4, 8, 12, 16]}
              domain={[0, 16]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid rgba(0,0,0,0.05)",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
              itemStyle={{ color: "#0A0A0C", fontWeight: 500 }}
              cursor={{ stroke: "#0A0A0C", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.2 }}
            />
            <Area
              type="monotone"
              dataKey="light"
              stroke="#d1d5db"
              strokeWidth={1}
              fill="url(#fillLight)"
              activeDot={{ r: 4, fill: "#d1d5db", stroke: "white" }}
            />
            <Area
              type="monotone"
              dataKey="medium"
              stroke="#9ca3af"
              strokeWidth={1.5}
              fill="url(#fillMedium)"
              activeDot={{ r: 4, fill: "#9ca3af", stroke: "white" }}
            />
            <Area
              type="monotone"
              dataKey="dark"
              stroke="#0A0A0C"
              strokeWidth={1.5}
              fill="url(#fillDark)"
              activeDot={{ r: 4, fill: "#0A0A0C", stroke: "white" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
