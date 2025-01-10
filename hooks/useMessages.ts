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
  } | null
  reactions?: Array<{
    emoji: string
    count: number
    reacted: boolean
  }>
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      await updateUserLastSeen()
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // First get messages with reactions
        const { data: messagesData, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (display_name),
            message_reactions (
              emoji,
              user_id
            ),
            thread_count
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })

        console.log('Raw message data:', messagesData) // Add this line

        if (error) throw error

        // Process messages with their reactions
        const processedMessages = messagesData.map(message => {
          // Group reactions by emoji
          const reactionCounts = message.message_reactions?.reduce((acc: any, reaction) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = {
                count: 0,
                reacted: false
              }
            }
            acc[reaction.emoji].count++
            if (reaction.user_id === session?.user.id) {
              acc[reaction.emoji].reacted = true
            }
            return acc
          }, {}) || {}

          // Convert to array format
          const reactions = Object.entries(reactionCounts).map(([emoji, data]: [string, any]) => ({
            emoji,
            count: data.count,
            reacted: data.reacted
          }))

          return {
            ...message,
            reactions
          }
        })

        console.log('Processed messages:', processedMessages) // Debug log
        setMessages(processedMessages)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching messages:', error)
        setLoading(false)
      }
    }

    fetchMessages()

    // Update the subscription to handle all message_reactions changes
    const subscription = supabase
      .channel('message_reactions_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          console.log('Reaction change detected:', payload)
          fetchMessages() // Refetch messages when reactions change
        }
      )
      .subscribe()

    // Also subscribe to message changes
    const messageSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      messageSubscription.unsubscribe()
    }
  }, [channelId])

  const sendMessage = async (content: string) => {
    try {
      await updateUserLastSeen()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert([{
          content,
          channel_id: channelId,
          user_id: session.user.id
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return { messages, loading, sendMessage }
}