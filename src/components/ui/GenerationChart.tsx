"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface ChartDataPoint {
  day: string;
  generations: number;
  published: number;
  scheduled: number;
}

interface GenerationChartProps {
  data?: ChartDataPoint[];
}

const fallbackData: ChartDataPoint[] = [
  { day: "Mon", generations: 0, published: 0, scheduled: 0 },
  { day: "Tue", generations: 0, published: 0, scheduled: 0 },
  { day: "Wed", generations: 0, published: 0, scheduled: 0 },
  { day: "Thu", generations: 0, published: 0, scheduled: 0 },
  { day: "Fri", generations: 0, published: 0, scheduled: 0 },
  { day: "Sat", generations: 0, published: 0, scheduled: 0 },
  { day: "Sun", generations: 0, published: 0, scheduled: 0 },
];

export default function GenerationChart({ data }: GenerationChartProps) {
  const chartData = data && data.length > 0 ? data : fallbackData;
  const maxVal = Math.max(...chartData.map((d) => d.generations), 4);
  const yMax = Math.ceil(maxVal / 4) * 4 || 4;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-[15px] text-[var(--sp-fg)]">
          Generation Throughput
        </h2>
      </div>

      <div className="flex-1 min-h-[220px] -ml-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillGenerations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4b5563" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4b5563" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillPublished" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#27C93F" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#27C93F" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="fillScheduled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A0A0C" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0A0A0C" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#6b7280"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 500 }}
              domain={[0, yMax]}
              allowDecimals={false}
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
              dataKey="generations"
              name="Generations"
              stroke="#4b5563"
              strokeWidth={1.5}
              fill="url(#fillGenerations)"
              activeDot={{ r: 4, fill: "#4b5563", stroke: "white" }}
            />
            <Area
              type="monotone"
              dataKey="published"
              name="Published"
              stroke="#27C93F"
              strokeWidth={1.5}
              fill="url(#fillPublished)"
              activeDot={{ r: 4, fill: "#27C93F", stroke: "white" }}
            />
            <Area
              type="monotone"
              dataKey="scheduled"
              name="Scheduled"
              stroke="#0A0A0C"
              strokeWidth={1.5}
              fill="url(#fillScheduled)"
              activeDot={{ r: 4, fill: "#0A0A0C", stroke: "white" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
