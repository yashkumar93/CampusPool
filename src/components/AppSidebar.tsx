"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  CarFront,
  GitCompare,
  Bus,
  Map,
  BarChart3,
  User,
  ShieldAlert,
  Zap,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/home" },
  { label: "Find Ride", icon: Search, href: "/rides/new?role=passenger" },
  { label: "Offer Ride", icon: CarFront, href: "/rides/new?role=driver" },
  { label: "Compare", icon: GitCompare, href: "/home" },
  { label: "Bus Routes", icon: Bus, href: "/bus-routes" },
  { label: "Map", icon: Map, href: "/map" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Profile", icon: User, href: "/profile" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.refresh();
    router.push("/auth");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-[#0a0f0b] border-r border-border/40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1DB954]/15">
          <Zap className="h-5 w-5 text-[#1DB954]" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          NXTPOOL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-2">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href.split("?")[0]));

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#1DB954]/15 text-[#1DB954]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout & SOS Section */}
      <div className="p-3 space-y-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-red-400 cursor-pointer"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Logout
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-background border border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-2">
                Are you sure you want to sign out of NxtPool?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 justify-end mt-4">
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 cursor-pointer"
        >
          <ShieldAlert className="h-4 w-4" />
          SOS Emergency
        </button>
      </div>
    </aside>
  );
}
