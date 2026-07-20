"use client";

import React from "react";
import {
  Users,
  CarFront,
  IndianRupee,
  Fuel,
  Leaf,
  Gauge,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const dataLineChart = [
  { name: "Mon", users: 400, rides: 100 },
  { name: "Tue", users: 480, rides: 130 },
  { name: "Wed", users: 510, rides: 140 },
  { name: "Thu", users: 500, rides: 135 },
  { name: "Fri", users: 580, rides: 160 },
  { name: "Sat", users: 220, rides: 60 },
  { name: "Sun", users: 180, rides: 40 },
];

const dataPieChart = [
  { name: "Shared Ride", value: 42, color: "#3b82f6" },
  { name: "Bus", value: 28, color: "#10b981" },
  { name: "Cab", value: 14, color: "#8b5cf6" },
  { name: "Bike Share", value: 11, color: "#f59e0b" },
  { name: "Other", value: 5, color: "#3b82f6" }, // Using a lighter blue or similar
];

const dataBarChart = [
  { time: "6a", value: 30 },
  { time: "7a", value: 90 },
  { time: "8a", value: 165 },
  { time: "9a", value: 120 },
  { time: "10a", value: 45 },
  { time: "12p", value: 40 },
  { time: "2p", value: 35 },
  { time: "4p", value: 95 },
  { time: "5p", value: 160 },
  { time: "6p", value: 135 },
  { time: "8p", value: 50 },
];

const popularRoutes = [
  { rank: 1, route: "Vijayawada → VIT AP", trips: 342, percentage: 90 },
  { rank: 2, route: "Guntur → VIT AP", trips: 286, percentage: 75 },
  { rank: 3, route: "Tenali → VIT AP", trips: 241, percentage: 65 },
  { rank: 4, route: "Mangalagiri → VIT AP", trips: 198, percentage: 50 },
  { rank: 5, route: "Amaravati → VIT AP", trips: 154, percentage: 35 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Banner */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c1fbd4]/10 text-aloe-text">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-foreground">Campus mobility insights</h2>
          <p className="text-sm text-muted-foreground">
            Live overview of how your campus travels — this semester.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Row 1 */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <Users className="mb-3 h-5 w-5 text-aloe-text" />
          <span className="text-2xl font-light text-foreground">2,148</span>
          <span className="text-xs text-muted-foreground">Verified students</span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <CarFront className="mb-3 h-5 w-5 text-aloe-text" />
          <span className="text-2xl font-light text-foreground">1,245</span>
          <span className="text-xs text-muted-foreground">Shared rides</span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <IndianRupee className="mb-3 h-5 w-5 text-aloe-text" />
          <span className="text-2xl font-light text-foreground">₹4.9L</span>
          <span className="text-xs text-muted-foreground">Money saved</span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <Fuel className="mb-3 h-5 w-5 text-pistachio-text" />
          <span className="text-2xl font-light text-foreground">3,120 L</span>
          <span className="text-xs text-muted-foreground">Fuel saved</span>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <Leaf className="mb-3 h-5 w-5 text-aloe-text" />
          <span className="text-2xl font-light text-foreground">7.4 t</span>
          <span className="text-xs text-muted-foreground">CO₂ reduced</span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <Gauge className="mb-3 h-5 w-5 text-pistachio-text" />
          <span className="text-2xl font-light text-foreground">3.2/seat</span>
          <span className="text-xs text-muted-foreground">Avg occupancy</span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <CheckCircle2 className="mb-3 h-5 w-5 text-aloe-text" />
          <span className="text-2xl font-light text-foreground">94%</span>
          <span className="text-xs text-muted-foreground">Ride success rate</span>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <Clock className="mb-3 h-5 w-5 text-aloe-text" />
          <span className="text-2xl font-light text-foreground">2.4 min</span>
          <span className="text-xs text-muted-foreground">Avg match time</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Line Chart */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-6 font-bold text-foreground">Daily active users & shared rides</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataLineChart} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickCount={5} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="rides" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-2 font-bold text-foreground">Transport mode share</h3>
          <div className="flex flex-1 items-center justify-between">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPieChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataPieChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col space-y-3 pr-4 text-sm font-medium">
              {dataPieChart.map((item) => (
                <div key={item.name} className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-6 font-bold text-foreground">Peak travel hours</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarChart} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickCount={5} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Popular Routes */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-6 font-bold text-foreground">Most popular routes</h3>
          <div className="flex flex-col space-y-5 flex-1 justify-center pb-2">
            {popularRoutes.map((route) => (
              <div key={route.rank} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground">
                    {route.rank}. {route.route}
                  </span>
                  <span className="text-muted-foreground">{route.trips} trips</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                    style={{ width: `${route.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
