'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { updateUserLastSeen } from '@/utils/user-status'

const supabase = createClient()

interface Profile {
  id: string
  display_name: string
}

interface MessageWithProfile {
  id: string
  content: string
  created_at: string
  user_id: string
  channel_id: string
  parent_id?: string
  profiles?: Profile  // From the join
}

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  thread_count: number
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
  reactions?: Array<{
    emoji: string
    count: number
    reacted: boolean
  }>
  file_attachments?: Array<{
    file_url: string
    file_name: string
    file_type: string
    file_size: number
  }>
}

function processReactions(reactions: any[] = []) {
  if (!reactions) return [];
  
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc: { [key: string]: any }, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        reacted: false
      }
    }
    acc[reaction.emoji].count++
    return acc
  }, {})

  // Convert to array format
  return Object.values(groupedReactions)
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      await updateUserLastSeen()
      try {
        const { data: messagesData, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              display_name,
              avatar_url
            ),
            file_attachments!file_attachments_message_id_fkey (
              file_url,
              file_name,
              file_type,
              file_size
            ),
            message_reactions (
              emoji,
              user_id
            )
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })

        if (error) throw error

        const processedMessages = messagesData.map(message => ({
          ...message,
          reactions: processReactions(message.message_reactions),
          file_attachments: message.file_attachments || []
        }))

        setMessages(processedMessages)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching messages:', error)
        setLoading(false)
      }
    }

    fetchMessages()

    // Message subscription
    const messageSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        () => fetchMessages()
      )
      .subscribe()

    // Modified reactions subscription - remove the filter
    const reactionsSubscription = supabase
      .channel('reactions_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        () => fetchMessages()
      )
      .subscribe()

    // Add new subscription for file_attachments
    const attachmentsSubscription = supabase
      .channel('file_attachments_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_attachments'
        },
        () => fetchMessages()
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
      reactionsSubscription.unsubscribe()
      attachmentsSubscription.unsubscribe()
    }
  }, [channelId])

  const sendMessage = async (content: string) => {
    console.log('🚨🚨🚨 SENDING MESSAGE STARTED 🚨🚨🚨');
    try {
      await updateUserLastSeen()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Send the message
      console.log('📝 Inserting message into database...');
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([{
          content,
          channel_id: channelId,
          user_id: session.user.id
        }])
        .select()
        .single()

      if (messageError) throw messageError
      console.log('✅ Message inserted:', message);

      // Generate and store embedding via API route
      try {
        console.log('🎯 Starting embedding generation...');
        const apiUrl = '/api/generate-embedding';
        console.log('API URL:', window.location.origin + apiUrl);
        
        const payload = {
          messageId: message.id,
          content: message.content
        };
        console.log('Payload:', payload);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('API response received:', {
          status: response.status,
          ok: response.ok
        });

        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          console.error('🔴 Error generating embedding:', data);
        } else {
          console.log('✅ Embedding generated successfully');
        }
      } catch (error) {
        console.error('🔴 Error calling embedding API:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return { messages, loading, sendMessage }
}