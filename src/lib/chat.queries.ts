import { supabase } from "@/integrations/supabase/client";

export async function listChatsWithLastMessage() {
  if (typeof window === "undefined") {
    return [];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Fetch group memberships
  const { data: memberships, error: memError } = await supabase
    .from("ride_group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (memError) throw memError;
  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);

  // 2. Fetch those groups
  const { data: groups, error: groupsError } = await supabase
    .from("ride_groups")
    .select("*")
    .in("id", groupIds);

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) return [];

  // 3. Fetch messages (latest 100 for these groups)
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, group_id, user_id, body, created_at")
    .in("group_id", groupIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (messagesError) throw messagesError;

  // Deduplicate to get the latest message per group
  const latestMessages = new Map<string, any>();
  const senderIds = new Set<string>();

  if (messages) {
    for (const msg of messages) {
      if (!latestMessages.has(msg.group_id)) {
        latestMessages.set(msg.group_id, msg);
        if (msg.user_id) senderIds.add(msg.user_id);
      }
    }
  }

  // 4. Fetch member counts
  const { data: allMembers, error: allMembersError } = await supabase
    .from("ride_group_members")
    .select("group_id, user_id")
    .in("group_id", groupIds);

  if (allMembersError) throw allMembersError;

  const memberCounts = new Map<string, number>();
  if (allMembers) {
    for (const m of allMembers) {
      memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1);
    }
  }

  // 5. Fetch sender profiles
  const senderProfilesMap = new Map<string, string>();
  if (senderIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("id, full_name")
      .in("id", Array.from(senderIds));

    if (profiles) {
      for (const p of profiles) {
        senderProfilesMap.set(p.id, p.full_name || "Someone");
      }
    }
  }

  // Combine results
  const result = groups.map((g) => {
    const msg = latestMessages.get(g.id);
    let lastMessage = null;
    if (msg) {
      lastMessage = {
        id: msg.id,
        body: msg.body,
        created_at: msg.created_at,
        senderName: senderProfilesMap.get(msg.user_id) || "Someone",
      };
    }

    return {
      ...g,
      memberCount: memberCounts.get(g.id) || 0,
      lastMessage,
    };
  });

  // Sort by last message time descending (or group creation time if no messages)
  result.sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.created_at).getTime();
    const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.created_at).getTime();
    return timeB - timeA;
  });

  return result;
}
