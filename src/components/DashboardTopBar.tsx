"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/home": "Dashboard",
  "/rides/new": "Rides",
  "/profile": "Profile",
};

export function DashboardTopBar() {
  const pathname = usePathname();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border/40 bg-background/90 backdrop-blur flex items-center justify-between px-6">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1DB954]/40 bg-[#1DB954]/10 px-3 py-1 text-[10px] font-bold text-[#1DB954] uppercase tracking-wider">
          ✓ Verified Student
        </span>

        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
