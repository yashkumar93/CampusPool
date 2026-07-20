"use client";

import { usePathname } from "next/navigation";
import { NotificationsDropdown } from "./NotificationsDropdown";

const pageTitles: Record<string, string> = {
  "/home": "Dashboard",
  "/rides/new": "Rides",
  "/rides/": "Ride Details",
  "/profile": "Profile",
  "/analytics": "Analytics",
  "/bus-routes": "Bus Routes",
  "/map": "Map",
  "/groups/": "Group Chat",
};

export function DashboardTopBar() {
  const pathname = usePathname();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-[#1e2c31]/60 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6">
      <h2 className="text-[13px] font-medium text-[#d4d4d8] tracking-wide">{title}</h2>

      <div className="flex items-center gap-3">
        <span className="pill-tag-aloe uppercase tracking-wider">
          ✓ Verified
        </span>

        <NotificationsDropdown />
      </div>
    </header>
  );
}
