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
    async function fetchMessages() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("direct_messages")
          .select(`
            *,
            sender:profiles!direct_messages_sender_profile_fkey (display_name, avatar_url)
          `)
          .or(
            `and(sender_id.eq.${session.user.id},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${session.user.id})`
          )
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data.map(msg => ({
          ...msg,
          sender_profile: msg.sender
        })));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    }

    fetchMessages();

    // Subscribe to changes
    const subscription = supabase
      .channel('direct_messages_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages'
        },
        () => {
          console.log('DM change detected, refetching...');
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [targetUserId]);

  const sendDM = async (content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from("direct_messages")
        .insert([
          {
            sender_id: session.user.id,
            recipient_id: targetUserId,
            content,
          },
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending DM:', error);
      throw error;
    }
  };

  return { messages, loading, sendDM };
} 