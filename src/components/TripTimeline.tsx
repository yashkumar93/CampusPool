import { CheckCircle2, Circle, Clock, Flag, MapPin, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "forming" | "in_progress" | "completed" | "cancelled" | string;

export interface TripTimelineProps {
  status: Status;
  createdAt: string;
  departAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface Step {
  key: string;
  label: string;
  hint?: string;
  icon: typeof Circle;
  done: boolean;
  active: boolean;
}

function fmt(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function formatStatusLabel(status: Status): string {
  const map: Record<string, string> = {
    forming: "Forming",
    matched: "Matched",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

function elapsed(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just started";
  if (mins < 60) return `Started ${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `Started ${h}h ${m}m ago` : `Started ${h}h ago`;
}

export function TripTimeline({ status, createdAt, departAt, startedAt, completedAt }: TripTimelineProps) {
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  const isForming = status === "forming";
  const isCancelled = status === "cancelled";
  const departPassed = new Date(departAt).getTime() <= Date.now();

  const steps: Step[] = [
    {
      key: "formed",
      label: "Group formed",
      hint: fmt(createdAt),
      icon: Flag,
      done: true,
      active: isForming,
    },
    {
      key: "depart",
      label: "Scheduled departure",
      hint: fmt(departAt),
      icon: Clock,
      done: isInProgress || isCompleted || departPassed,
      active: isForming && !departPassed,
    },
    {
      key: "started",
      label: startedAt ? "Trip in progress" : "Waiting for driver to start",
      hint: startedAt
        ? (isInProgress ? elapsed(startedAt) : fmt(startedAt))
        : "Driver taps Start when leaving",
      icon: Play,
      done: isInProgress || isCompleted,
      active: isInProgress,
    },
    {
      key: "arrived",
      label: isCompleted ? "Arrived at destination" : isCancelled ? "Ride cancelled" : "Arrival",
      hint: completedAt ? fmt(completedAt) : "",
      icon: MapPin,
      done: isCompleted,
      active: false,
    },
  ];

  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Trip status</div>
        <div className={cn(
          "text-xs uppercase tracking-widest",
          isCancelled ? "text-destructive" : "text-muted-foreground",
        )}>
          {formatStatusLabel(status)}
        </div>
      </div>
      <ol className="relative space-y-4">
        {steps.map((s, i) => {
          const Icon = s.done ? CheckCircle2 : s.icon;
          const isLast = i === steps.length - 1;
          return (
            <li key={s.key} className="relative flex gap-3">
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[13px] top-6 h-full w-px transition-all duration-500",
                    s.done ? "bg-primary/60" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  s.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : s.active
                      ? "border-primary bg-background text-primary"
                      : isCancelled && isLast
                        ? "border-destructive bg-background text-destructive"
                        : "border-border bg-background text-muted-foreground",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", s.active && !s.done && "animate-pulse")} />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div
                  className={cn(
                    "text-sm font-medium",
                    isCancelled && isLast ? "text-destructive" :
                    !s.done && !s.active && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </div>
                {s.hint && <div className="text-xs text-muted-foreground">{s.hint}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
