"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendMessage } from "@/lib/rides.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Send,
  ArrowDown,
  MessageCircle,
  X,
  Reply,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ── */

interface Member {
  user_id: string;
  profile: {
    full_name: string;
    department?: string | null;
  } | null;
}

interface Message {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  reply_to?: string | null;
}

interface ChatPanelProps {
  groupId: string;
  currentUserId: string;
  members: Member[];
  messages: Message[];
  isCompleted: boolean;
}

/* ── Helpers ── */

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-pink-600",
  "bg-indigo-600",
  "bg-teal-600",
];

function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++)
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function msgTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fullTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)
    return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/* ── Component ── */

export function ChatPanel({
  groupId,
  currentUserId,
  members,
  messages,
  isCompleted,
}: ChatPanelProps) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cp:chat-muted") === "true";
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );
  const lastTypingSentRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevMessageCountRef = useRef(messages.length);

  // Initialize notification sound
  useEffect(() => {
    // Use a simple Web Audio API beep instead of an audio file
    audioRef.current = null; // We'll use Web Audio API inline
  }, []);

  function playNotificationSound() {
    if (muted) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }

  // Play sound on new messages from others
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.user_id !== currentUserId) {
        playNotificationSound();
      }
    }
    prevMessageCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Realtime: new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-messages-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["group", groupId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, qc]);

  // Realtime: typing indicators
  useEffect(() => {
    const ch = supabase.channel(`typing-${groupId}`, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      const uid = (payload as { userId?: string })?.userId;
      if (!uid) return;
      setTypingUsers((prev) => ({ ...prev, [uid]: Date.now() }));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const now = Date.now();
          const next: Record<string, number> = {};
          for (const [k, t] of Object.entries(prev))
            if (now - t < 2500) next[k] = t;
          return next;
        });
      }, 3000);
    }).subscribe();
    typingChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      typingChannelRef.current = null;
    };
  }, [groupId]);

  // Realtime: presence
  useEffect(() => {
    const channel = supabase.channel(`presence-${groupId}`);
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userIds = Object.values(state)
          .flat()
          .map(
            (p) => (p as unknown as { user_id: string }).user_id
          )
          .filter(Boolean);
        setOnlineUsers(userIds);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: currentUserId });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, currentUserId]);

  // Notify typing
  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    const ch = typingChannelRef.current;
    if (!ch) return;
    const me = members.find((m) => m.user_id === currentUserId);
    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId: currentUserId,
        name: me?.profile?.full_name ?? "Someone",
      },
    });
  }, [members, currentUserId]);

  // Auto-scroll
  useEffect(() => {
    if (!showScrollBtn) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [messages.length, showScrollBtn]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setShowScrollBtn(!atBottom);
  }, []);

  function scrollToBottom() {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
    setShowScrollBtn(false);
  }

  // Send message mutation
  const sendMut = useMutation({
    mutationFn: () =>
      sendMessage({
        groupId,
        body: body.trim(),
        ...(replyTo ? { reply_to: replyTo.id } : {}),
      }),
    onSuccess: () => {
      setBody("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Failed to send"),
  });

  // Build grouped messages with date separators
  const enrichedMessages = messages.map((m, i) => {
    const prev = i > 0 ? messages[i - 1] : null;
    const isFirstInGroup = !prev || prev.user_id !== m.user_id;
    const showDateSeparator = !prev || !isSameDay(prev.created_at, m.created_at);
    return { ...m, isFirstInGroup, showDateSeparator };
  });

  const typingNames = Object.keys(typingUsers)
    .filter((uid) => uid !== currentUserId)
    .map(
      (uid) =>
        members.find((m) => m.user_id === uid)?.profile?.full_name ?? "Someone"
    );

  const onlineCount = onlineUsers.filter((uid) => uid !== currentUserId).length;

  const memberMap = new Map(members.map((m) => [m.user_id, m]));

  return (
    <div className="surface-card flex flex-col relative overflow-hidden" style={{ height: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Group Chat</span>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} online
            </span>
          )}
        </div>
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            localStorage.setItem("cp:chat-muted", String(next));
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          title={muted ? "Unmute notifications" : "Mute notifications"}
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 space-y-0.5 overflow-y-auto px-4 py-3 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-transparent">
              <MessageCircle className="h-7 w-7 text-primary/60" />
            </div>
            <div>
              <div className="text-sm font-semibold">Start the conversation</div>
              <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
                Say hello to your co-riders and coordinate your trip.
              </p>
            </div>
          </div>
        ) : (
          enrichedMessages.map((m) => {
            const mine = m.user_id === currentUserId;
            const author = memberMap.get(m.user_id)?.profile;
            const isOnline = onlineUsers.includes(m.user_id);
            const repliedMsg = m.reply_to
              ? messages.find((msg) => msg.id === m.reply_to)
              : null;
            const repliedAuthor = repliedMsg
              ? memberMap.get(repliedMsg.user_id)?.profile
              : null;

            return (
              <div key={m.id}>
                {/* Date separator */}
                {m.showDateSeparator && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-border/30" />
                    <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                      {dateSeparatorLabel(m.created_at)}
                    </span>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>
                )}

                {/* Message row */}
                <div
                  className={cn(
                    "group/msg flex gap-2",
                    mine ? "justify-end" : "justify-start",
                    m.isFirstInGroup ? "pt-3" : "pt-0.5"
                  )}
                >
                  {/* Avatar (others only, first in group) */}
                  {!mine && m.isFirstInGroup ? (
                    <div className="relative mt-1 shrink-0">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white",
                          avatarColor(m.user_id)
                        )}
                      >
                        {getInitials(author?.full_name ?? "??")}
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                      )}
                    </div>
                  ) : !mine ? (
                    <div className="w-7 shrink-0" />
                  ) : null}

                  {/* Bubble */}
                  <div className="max-w-[75%] min-w-0">
                    {/* Reply preview */}
                    {repliedMsg && (
                      <div
                        className={cn(
                          "mb-1 rounded-md border-l-2 border-primary/50 bg-primary/[0.06] px-2.5 py-1.5 text-[11px]",
                          mine ? "ml-auto max-w-[90%]" : "max-w-[90%]"
                        )}
                      >
                        <div className="font-medium text-primary/80">
                          {repliedAuthor?.full_name ?? "Someone"}
                        </div>
                        <div className="truncate text-muted-foreground">
                          {repliedMsg.body}
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "relative rounded-2xl px-3 py-2 text-sm transition-colors",
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      {!mine && author && m.isFirstInGroup && (
                        <div className="text-[11px] font-semibold opacity-70 mb-0.5">
                          {author.full_name}
                        </div>
                      )}
                      <div className="break-words whitespace-pre-wrap">{m.body}</div>
                      <div
                        className={cn(
                          "text-[10px] mt-0.5 select-none",
                          mine
                            ? "text-primary-foreground/50"
                            : "text-muted-foreground/60"
                        )}
                        title={fullTimestamp(m.created_at)}
                      >
                        {msgTime(m.created_at)}
                      </div>

                      {/* Reply button — visible on hover */}
                      {!isCompleted && (
                        <button
                          onClick={() => setReplyTo(m)}
                          className={cn(
                            "absolute -top-2 opacity-0 group-hover/msg:opacity-100 transition-all",
                            "flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border/50 shadow-sm",
                            "text-muted-foreground hover:text-primary hover:border-primary/40",
                            mine ? "-left-3" : "-right-3"
                          )}
                          title="Reply"
                        >
                          <Reply className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full shadow-lg gap-1 h-7 px-3 text-xs"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-3 w-3" /> New messages
          </Button>
        </div>
      )}

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="border-t border-border/30 px-4 py-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary" />
            </span>
            {typingNames.slice(0, 2).join(", ")}
            {typingNames.length > 2
              ? ` +${typingNames.length - 2}`
              : ""}{" "}
            typing…
          </span>
        </div>
      )}

      {/* Reply-to bar */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-border/30 bg-primary/[0.04] px-4 py-2">
          <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="min-w-0 flex-1 text-xs">
            <span className="font-medium text-primary">
              {memberMap.get(replyTo.user_id)?.profile?.full_name ?? "Someone"}
            </span>
            <p className="truncate text-muted-foreground">{replyTo.body}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Input */}
      <form
        className="flex gap-2 border-t border-border/40 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim() || isCompleted) return;
          sendMut.mutate();
        }}
      >
        <Input
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (e.target.value.trim()) notifyTyping();
          }}
          placeholder={isCompleted ? "Ride completed" : "Type a message…"}
          disabled={isCompleted}
          className="bg-muted/50 border-border/30 focus-visible:ring-primary/40"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!body.trim() || sendMut.isPending || isCompleted}
          className="shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
