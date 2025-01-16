"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const CHATTYG_ID = 'a7756e85-e983-464e-843b-f74e3e34decd';

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
        () => fetchMessages()
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

      // Send user's message
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

      // If the recipient is ChattyG, get AI response
      if (targetUserId === CHATTYG_ID) {
        try {
          const response = await fetch('/api/chattyg', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              question: content,
              userId: session.user.id 
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get ChattyG response');
          }

          const { answer } = await response.json();

          // Insert ChattyG's response
          const { error: responseError } = await supabase
            .from("direct_messages")
            .insert([
              {
                sender_id: CHATTYG_ID,
                recipient_id: session.user.id,
                content: answer,
              },
            ]);

          if (responseError) throw responseError;
        } catch (error) {
          console.error('Error getting ChattyG response:', error);
          // Insert error message
          await supabase
            .from("direct_messages")
            .insert([
              {
                sender_id: CHATTYG_ID,
                recipient_id: session.user.id,
                content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
              },
            ]);
        }
      }
    } catch (error) {
      console.error('Error sending DM:', error);
      throw error;
    }
  };

  return { messages, loading, sendDM };
} 