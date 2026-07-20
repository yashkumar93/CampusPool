"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyNotifications } from "@/lib/rides.queries";
import { respondJoinRequest } from "@/lib/rides.actions";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: listMyNotifications,
  });

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const respondMut = useMutation({
    mutationFn: (v: { requestId: string; accept: boolean }) => {
      setRespondingId(v.requestId);
      return respondJoinRequest(v);
    },
    onSuccess: (res, variables) => {
      setRespondingId(null);
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
      qc.invalidateQueries({ queryKey: ["my-groups"] });

      if (res.groupId && variables.accept) {
        toast.success("Ride confirmed! Opening group chat...");
        setOpen(false);
        router.push(`/groups/${res.groupId}`);
      } else if (!variables.accept) {
        toast.success("Request declined");
      }
    },
    onError: (e) => {
      setRespondingId(null);
      toast.error(e instanceof Error ? e.message : "Failed to respond");
    },
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

  const pendingNotifications = notifications.filter((n: any) => n.status === "pending");
  const hasNotifications = pendingNotifications.length > 0;

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
      <PopoverContent className="w-96 p-0 mr-4 mt-2 bg-card border-border/40 shadow-xl" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h4 className="text-sm font-bold text-foreground">Notifications</h4>
          {hasNotifications && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {pendingNotifications.length} New
            </Badge>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {!hasNotifications ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <ul className="flex flex-col">
              {pendingNotifications.map((notif: any) => (
                <li key={notif.id} className="border-b border-border/20 last:border-0">
                  <div className="px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/20 mt-0.5">
                        {((notif.profile?.full_name ?? "Student").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase())}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-tight">
                          <span className="font-bold">{notif.profile?.full_name ?? "Someone"}</span>{" "}
                          requested to join your ride
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">
                          {notif.ride?.pickup_label} → {notif.ride?.dest_label}
                        </p>

                        {/* Inline Accept / Decline buttons */}
                        <div className="flex items-center gap-2 mt-2.5">
                          <Button
                            size="sm"
                            className="h-8 gap-1 px-3 text-xs font-semibold"
                            onClick={() => respondMut.mutate({ requestId: notif.id, accept: true })}
                            disabled={respondMut.isPending && respondingId === notif.id}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {respondMut.isPending && respondingId === notif.id ? "Accepting..." : "Accept"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 px-3 text-xs font-semibold"
                            onClick={() => respondMut.mutate({ requestId: notif.id, accept: false })}
                            disabled={respondMut.isPending && respondingId === notif.id}
                          >
                            <X className="h-3.5 w-3.5" />
                            Decline
                          </Button>
                          <Link
                            href={`/rides/${notif.target_ride_id}`}
                            onClick={() => setOpen(false)}
                            className="ml-auto text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                          >
                            View <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
