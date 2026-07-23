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
  MessageCircle,
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
  { label: "Chats", icon: MessageCircle, href: "/chats" },
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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-black border-r border-[#1e2c31]/60">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c1fbd4]/10">
          <Zap className="h-4 w-4 text-[#c1fbd4]" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          NXTPOOL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href.split("?")[0]));

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/[0.06] text-[#c1fbd4] border-l-2 border-[#c1fbd4] ml-0 pl-2.5"
                  : "text-[#a1a1aa] hover:bg-white/[0.03] hover:text-[#d4d4d8] border-l-2 border-transparent"
              }`}
            >
              <Icon className="h-[16px] w-[16px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-[#1e2c31]/60" />

      {/* Logout & SOS Section */}
      <div className="p-3 space-y-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-[13px] font-medium text-[#a1a1aa] transition-all hover:bg-white/[0.03] hover:text-red-400 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0a0a0a] border border-[#1e2c31]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white font-medium">Sign out?</AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-[#a1a1aa] mt-2">
                Are you sure you want to sign out of NxtPool?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 justify-end mt-4">
              <AlertDialogCancel className="btn-pill-ghost cursor-pointer border-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={signOut} className="btn-pill-danger cursor-pointer">
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600/90 px-3 py-2 text-[13px] font-semibold text-white transition-all hover:bg-red-600 cursor-pointer"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          SOS Emergency
        </button>
      </div>
    </aside>
  );
}
