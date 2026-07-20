"use client";

import React from "react";
import { BusRoutesExplorer } from "@/components/BusRoutesExplorer";
import { Bus, Sparkles } from "lucide-react";

export default function BusRoutesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 border border-border rounded-xl p-4 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-aloe-text" />
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Live Transit & Campus Bus Routes
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Powered by Google Maps Transit API — explore real-time bus numbers, schedules, stops, and college transfer lines.
          </p>
        </div>
      </div>

      <BusRoutesExplorer />
    </div>
  );
}
