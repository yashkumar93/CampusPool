"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  name: string;
  role: string;
}

export function RideConfirmedOverlay({
  isOpen,
  groupId,
  participants = [],
  title = "Ride Confirmed!",
  subtitle = "You are teamed up with:",
  onClose,
}: {
  isOpen: boolean;
  groupId?: string | null;
  participants?: Participant[];
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center text-center p-6 space-y-6 w-full max-w-md">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center animate-[bounce_1s_infinite]">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        
        {participants.length > 0 && (
          <>
            <p className="text-muted-foreground text-lg">{subtitle}</p>
            <div className="flex items-center justify-center gap-6 py-4 flex-wrap">
              {participants.map((p, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center border-2 border-primary/50 text-xl font-bold text-white">
                    {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="mt-2 text-sm font-medium text-white">{p.name}</span>
                  <span className="text-xs text-primary capitalize">{p.role}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="w-full pt-8 flex flex-col gap-3">
          {groupId ? (
            <Button
              className="w-full h-12 btn-neo-primary font-bold text-lg"
              onClick={() => router.push(`/groups/${groupId}`)}
            >
              Open Group Chat
            </Button>
          ) : (
            <Button
              className="w-full h-12 btn-neo-primary font-bold text-lg"
              onClick={() => onClose?.()}
            >
              Awesome!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
