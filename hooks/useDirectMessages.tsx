"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useDirectMessages(targetUserId: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any;
    let currentUserId: string | null = null;

    async function fetchMessages() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      currentUserId = session.user.id;

      const { data, error } = await supabase
        .from("direct_messages")
        .select(`
          id,
          sender_id,
          recipient_id,
          content,
          created_at,
          sender_profile:profiles!sender_id (display_name, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${session.user.id},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${session.user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching direct messages:", error);
        setLoading(false);
        return;
      }

      setMessages(data as DirectMessage[]);
      setLoading(false);
    }

    fetchMessages();

    // Set up real-time subscription
    subscription = supabase
      .channel(`direct-messages-${targetUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId}))`
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [targetUserId]);

  const sendDM = async (content: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("direct_messages")
      .insert([
        {
          sender_id: session.user.id,
          recipient_id: targetUserId,
          content,
        },
      ]);

    if (error) {
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendDM,
  };
} 