"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMyProfile } from "@/lib/rides.actions";
import { getMyProfile } from "@/lib/rides.queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Star, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfile(),
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [hostel, setHostel] = useState("");
  const [gender, setGender] = useState<string>("");
  const [bio, setBio] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setDepartment(profile.department ?? "");
    setYear(profile.year ?? "");
    setHostel(profile.hostel ?? "");
    setGender(profile.gender ?? "");
    setBio(profile.bio ?? "");
    setDrivingLicense(profile.driving_license ?? "");
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        full_name: fullName.trim(),
        phone: phone || null,
        department: department || null,
        year: year || null,
        hostel: hostel || null,
        gender: gender as "male" | "female" | "other" | "prefer_not_to_say" || null,
        bio: bio || null,
        driving_license: drivingLicense || null,
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/home">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
          {getInitials(profile.full_name ?? "??")}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{profile.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {profile.verified && (
              <span className="inline-flex items-center gap-1 text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {profile.email && <span className="truncate">{profile.email}</span>}
          </div>
          {(profile.rating_count ?? 0) > 0 && (
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium">{Number(profile.rating_avg).toFixed(1)}</span>
              <span className="text-muted-foreground">({profile.rating_count} ratings)</span>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Personal Information */}
        <div className="surface-card p-5 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="fullName">Full name *</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="surface-card p-5 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Academic Details</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="CSE, ECE…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="3rd year" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hostel">Hostel</Label>
              <Input id="hostel" value={hostel} onChange={(e) => setHostel(e.target.value)} placeholder="Men's Block A" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="surface-card p-5 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">About</h2>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about yourself…"
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground">{bio.length}/300 characters</p>
          </div>
        </div>

        {/* Driver Information */}
        <div className="surface-card p-5 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Driver Information</h2>
          <div className="space-y-1.5">
            <Label htmlFor="drivingLicense">Driving License Number</Label>
            <Input 
              id="drivingLicense" 
              value={drivingLicense} 
              onChange={(e) => setDrivingLicense(e.target.value)} 
              placeholder="DL-1420110012345" 
            />
            <p className="text-[11px] text-muted-foreground">If you plan to offer rides as a driver, please provide your driving license to verify your driving eligibility.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending} className="gap-2 glow-primary min-w-[140px]">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
