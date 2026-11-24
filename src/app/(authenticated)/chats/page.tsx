"use client";

import Link from "next/link";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { listChatsWithLastMessage } from "@/lib/chat.queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ArrowRight, Clock, Users, Plus } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ────────────── helpers ────────────── */

function relTimeMsg(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function relDepart(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diff / 60_000);
  if (mins < 0) return "departed";
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

/* ────────────── Main Page ────────────── */

export default function ChatsPage() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1.5 animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Chats
        </h1>
        <p className="text-sm text-muted-foreground">Your ride group conversations</p>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <Suspense fallback={<ChatsSkeleton />}>
          <ChatsList />
        </Suspense>
      </div>
    </div>
  );
}

function ChatsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card p-4">
          <div className="h-12 w-12 shrink-0 rounded-full shimmer" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-1/2 rounded shimmer" />
            <div className="h-3 w-3/4 rounded shimmer" />
          </div>
          <div className="h-3 w-10 shrink-0 rounded shimmer" />
        </div>
      ))}
    </div>
  );
}

function ChatsList() {
  const qc = useQueryClient();
  const { data: chats } = useSuspenseQuery(
    queryOptions({ queryKey: ["chats"], queryFn: listChatsWithLastMessage })
  );

  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load unread counts
    try {
      const raw = localStorage.getItem("cp:unread");
      if (raw) setUnread(JSON.parse(raw));
    } catch { /* ignore */ }

    // Realtime subscription
    const channel = supabase
      .channel("chats-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const gid = (payload.new as { group_id?: string }).group_id;
          if (!gid || !chats.some((c) => c.id === gid)) return;
          
          setUnread((prev) => {
            const next = { ...prev, [gid]: (prev[gid] ?? 0) + 1 };
            try { localStorage.setItem("cp:unread", JSON.stringify(next)); } catch { /* ignore */ }
            return next;
          });
          
          qc.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chats, qc]);

  function clearUnread(id: string) {
    setUnread((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      try { localStorage.setItem("cp:unread", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/30 bg-card p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-transparent mb-4">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold">No conversations yet</h3>
        <p className="mt-2 mb-6 max-w-xs text-sm text-muted-foreground">
          Join or create a ride to start chatting with your group.
        </p>
        <Link href="/rides/new">
          <Button className="gap-2 bg-primary text-black hover:bg-primary/90 font-semibold rounded-full px-6">
            <Plus className="h-4 w-4" /> Start a Ride
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {chats.map((chat, i) => {
        const hasUnread = !!unread[chat.id];
        const lastMsgTime = chat.lastMessage 
          ? relTimeMsg(chat.lastMessage.created_at)
          : relTimeMsg(chat.created_at);

        return (
          <li 
            key={chat.id} 
            className="animate-fade-in-up" 
            style={{ animationDelay: `${(i + 1) * 60}ms` }}
          >
            <Link
              href={`/groups/${chat.id}`}
              onClick={() => clearUnread(chat.id)}
              className={`flex items-stretch gap-4 rounded-xl border p-4 transition-all duration-200 group ${
                hasUnread 
                  ? "border-primary/30 bg-primary/[0.03]" 
                  : "border-border/30 bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              }`}
            >
              {/* Left: Avatar */}
              <div className="flex shrink-0 items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 text-violet-400 font-bold group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5 mr-0.5" />
                  <span className="text-sm">{chat.memberCount || 1}</span>
                </div>
              </div>

              {/* Middle: Info */}
              <div className="flex flex-1 flex-col justify-center min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[15px] font-semibold truncate">
                    <span className="truncate">{chat.pickup_label}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    <span className="truncate">{chat.dest_label}</span>
                  </div>
                </div>

                {chat.lastMessage ? (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/80">{chat.lastMessage.senderName}:</span>{" "}
                    {chat.lastMessage.body}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground italic">No messages yet</p>
                )}

                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="capitalize text-[10px] font-medium border-border/50">
                    {chat.status}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-[10px]">
                    <Clock className="h-3 w-3" /> {relDepart(chat.depart_at)}
                  </span>
                </div>
              </div>

              {/* Right: Time and Unread */}
              <div className="flex shrink-0 flex-col items-end justify-between pt-1">
                <span className={`text-[11px] ${hasUnread ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {lastMsgTime}
                </span>
                
                {hasUnread && (
                  <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-black animate-pulse">
                    {unread[chat.id]}
                  </div>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
