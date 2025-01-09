'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

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
  channel_id: string
  profiles: {
    display_name: string | null
  } | null
  message_reactions?: {
    emoji: string
    user_id: string
  }[]
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: RealtimeChannel

    const fetchMessages = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (display_name),
            message_reactions (emoji, user_id)
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })

        console.log('Raw messages with reactions:', data) // Debug log

        if (error) throw error

        // Process messages and their reactions
        const processedMessages = data.map((message: Message) => {
          const reactionGroups = (message.message_reactions || []).reduce((acc: Record<string, { count: number, reacted: boolean }>, reaction) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = { count: 0, reacted: false }
            }
            acc[reaction.emoji].count++
            if (reaction.user_id === session?.user?.id) {
              acc[reaction.emoji].reacted = true
            }
            return acc
          }, {})

          const reactions = Object.entries(reactionGroups).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            reacted: data.reacted
          }))

          console.log('Processed message reactions:', message.id, reactions) // Debug log

          return {
            ...message,
            reactions
          }
        })

        setMessages(processedMessages)
        setLoading(false)

        // Subscribe to reaction changes
        subscription = supabase
          .channel(`reactions:${channelId}`)
          .on('postgres_changes', 
            {
              event: '*',
              schema: 'public',
              table: 'message_reactions',
              filter: `message_id=eq.${channelId}`
            },
            () => {
              fetchMessages() // Refetch when reactions change
            }
          )
          .subscribe()
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }

    fetchMessages()

    return () => {
      subscription?.unsubscribe()
    }
  }, [channelId])

  return {
    messages,
    loading,
    sendMessage: async (content: string) => {
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
    }
  }
}