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
      <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg font-medium text-foreground">User Profile</SheetTitle>
        </SheetHeader>

        {isLoading || !profile ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Avatar & Name Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#c1fbd4]/10 text-aloe-text text-xl font-medium border border-[#c1fbd4]/15">
                {getInitials(profile.full_name ?? "??")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-foreground truncate">{profile.full_name}</h3>
                  {profile.verified && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c1fbd4]/20">
                      <ShieldCheck className="h-3 w-3 text-aloe-text" />
                    </div>
                  )}
                </div>
                {(profile.rating_count ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star className="h-3.5 w-3.5 fill-[#c1fbd4] text-aloe-text" />
                    <span className="text-sm font-medium text-foreground">{Number(profile.rating_avg).toFixed(1)}</span>
                    <span className="text-xs text-[#71717a]">({profile.rating_count} ratings)</span>
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
                <Badge className="bg-[#c1fbd4]/10 text-aloe-text hover:bg-[#c1fbd4]/10 gap-1 font-medium text-xs rounded-full border-0">
                  <ShieldCheck className="h-3 w-3" /> Verified Student
                </Badge>
              )}
              {profile.driving_license && (
                <Badge className="bg-[#d4f9e0]/10 text-pistachio-text hover:bg-[#d4f9e0]/10 gap-1 font-medium text-xs rounded-full border-0">
                  <IdCard className="h-3 w-3" /> License on file
                </Badge>
              )}
            </div>

            {/* Safety/Privacy Notice for partial profiles */}
            {!profile.is_full_profile && (
              <div className="p-3 bg-[#c1fbd4]/5 border border-[#c1fbd4]/15 text-xs text-[#a1a1aa] rounded-xl flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-aloe-text shrink-0" />
                <span>Contact details are locked for safety. Send a request to team up or join to unlock phone number and email!</span>
              </div>
            )}

            {/* Details Grid */}
            <div className="space-y-1">
              <h4 className="text-xs font-medium uppercase tracking-wider text-[#71717a] mb-3">Contact & Details</h4>
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-[#1e2c31]/50">
                {profile.phone ? (
                  <ProfileRow icon={Phone} label="Phone" value={profile.phone} />
                ) : !profile.is_full_profile ? (
                  <ProfileRow icon={Phone} label="Phone" value="•••••••••• (Locked)" />
                ) : null}
                
                {profile.email ? (
                  <ProfileRow icon={Mail} label="Email" value={profile.email} />
                ) : !profile.is_full_profile ? (
                  <ProfileRow icon={Mail} label="Email" value="•••••••••••• (Locked)" />
                ) : null}

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
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
        <Icon className="h-3.5 w-3.5 text-[#71717a]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate mt-0.5">{value}</div>
      </div>
    </div>
  );
}
