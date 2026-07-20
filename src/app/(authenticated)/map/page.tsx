"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { listMapRadarData, getMyProfile } from "@/lib/rides.queries";
import { CampusRadarMap } from "@/components/CampusRadarMap";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["map-radar"],
    queryFn: listMapRadarData,
    refetchInterval: 15000, // Refresh radar every 15s
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 border border-border rounded-xl p-4 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Live Campus Radar & Map
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time dots representing classmates offering rides, passengers looking for seats, and active trips across campus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 border-border/60 hover:bg-white/5 font-medium text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            Refresh Radar
          </Button>
        </div>
      </div>

      <CampusRadarMap
        rides={data?.rides ?? []}
        activeTrips={data?.activeTrips ?? []}
        currentUserId={profile?.id}
      />
    </div>
  );
}
