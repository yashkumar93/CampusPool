"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Route as RouteIcon, User, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.refresh();
    router.push("/auth");
  };

  const isOnProfile = pathname === "/profile";
  const isOnNewRide = pathname.startsWith("/rides/new");

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/home" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <RouteIcon className="h-4 w-4" />
            </span>
            CampusPool
          </Link>
          <nav className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/rides/new">
                  <Button size="sm" className={`gap-1.5 ${isOnNewRide ? "glow-primary" : ""}`}>
                    <Plus className="h-4 w-4" /> New ride
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Create a new ride</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/profile">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Profile"
                    className={isOnProfile ? "text-primary" : ""}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Your profile</TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="Sign out">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to sign out of CampusPool?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={signOut}>Sign out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </nav>
        </div>
      </header>
    </TooltipProvider>
  );
}