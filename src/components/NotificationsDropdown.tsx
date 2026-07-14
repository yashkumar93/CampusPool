"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyNotifications } from "@/lib/rides.queries";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: listMyNotifications,
  });

  useEffect(() => {
    // Listen for new join requests
    const channel = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "join_requests" },
        () => {
          qc.invalidateQueries({ queryKey: ["my-notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const hasNotifications = notifications.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 bg-card border-border/40 shadow-xl" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h4 className="text-sm font-bold text-foreground">Notifications</h4>
          {hasNotifications && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {notifications.length} New
            </Badge>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!hasNotifications ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <ul className="flex flex-col">
              {notifications.map((notif: any) => (
                <li key={notif.id}>
                  <Link 
                    href={`/rides/${notif.target_ride_id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-white/5 transition-colors border-b border-border/20 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-[#b7c6c2] text-xs font-bold border border-secondary/30 mt-0.5">
                        {((notif.profile?.full_name ?? "Student").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase())}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground leading-tight">
                          <span className="font-bold">{notif.profile?.full_name ?? "Someone"}</span> requested to join your ride
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                          {notif.ride?.pickup_label} → {notif.ride?.dest_label}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
