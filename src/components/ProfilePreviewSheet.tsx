"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicProfile } from "@/lib/rides.queries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Star, ShieldCheck, Phone, Mail, Building2, GraduationCap,
  Home, IdCard, User, Loader2,
} from "lucide-react";

interface ProfilePreviewSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function ProfilePreviewSheet({ userId, open, onOpenChange }: ProfilePreviewSheetProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => getPublicProfile({ userId: userId! }),
    enabled: !!userId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-background border-border/40 overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg font-bold">User Profile</SheetTitle>
        </SheetHeader>

        {isLoading || !profile ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Avatar & Name Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xl font-bold border border-primary/20">
                {getInitials(profile.full_name ?? "??")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold truncate">{profile.full_name}</h3>
                  {profile.verified && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1DB954]/20">
                      <ShieldCheck className="h-3 w-3 text-[#1DB954]" />
                    </div>
                  )}
                </div>
                {(profile.rating_count ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-sm font-semibold">{Number(profile.rating_avg).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({profile.rating_count} ratings)</span>
                  </div>
                )}
                {profile.bio && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Verification Badges */}
            <div className="flex flex-wrap gap-2">
              {profile.verified && (
                <Badge className="bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/15 gap-1 font-semibold text-xs">
                  <ShieldCheck className="h-3 w-3" /> Verified Student
                </Badge>
              )}
              {profile.driving_license && (
                <Badge className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/15 gap-1 font-semibold text-xs">
                  <IdCard className="h-3 w-3" /> License on file
                </Badge>
              )}
            </div>

            {/* Details Grid */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Contact & Details</h4>
              <div className="rounded-xl border border-border/30 bg-card overflow-hidden divide-y divide-border/15">
                {profile.phone && (
                  <ProfileRow icon={Phone} label="Phone" value={profile.phone} />
                )}
                {profile.email && (
                  <ProfileRow icon={Mail} label="Email" value={profile.email} />
                )}
                {profile.college && (
                  <ProfileRow icon={Building2} label="College" value={profile.college} />
                )}
                {profile.department && (
                  <ProfileRow icon={GraduationCap} label="Department" value={profile.department} />
                )}
                {profile.year && (
                  <ProfileRow icon={GraduationCap} label="Year" value={`${profile.year} Year`} />
                )}
                {profile.hostel && (
                  <ProfileRow icon={Home} label="Hostel" value={profile.hostel} />
                )}
                {profile.gender && (
                  <ProfileRow icon={User} label="Gender" value={profile.gender.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} />
                )}
                {profile.driving_license && (
                  <ProfileRow icon={IdCard} label="Driving License" value={profile.driving_license} />
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate mt-0.5">{value}</div>
      </div>
    </div>
  );
}
