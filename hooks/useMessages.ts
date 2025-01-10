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

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      await updateUserLastSeen()
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        const { data: messagesData, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              display_name,
              avatar_url
            ),
            file_attachments (
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

        const processedMessages = messagesData.map(message => {
          // Process reactions
          const reactionGroups = message.message_reactions?.reduce((acc: any, reaction) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = {
                count: 0,
                reacted: false
              }
            }
            acc[reaction.emoji].count++
            if (reaction.user_id === session?.user?.id) {
              acc[reaction.emoji].reacted = true
            }
            return acc
          }, {}) || {}

          const reactions = Object.entries(reactionGroups).map(([emoji, data]: [string, any]) => ({
            emoji,
            count: data.count,
            reacted: data.reacted
          }))

          return {
            ...message,
            reactions,
            file_attachments: message.file_attachments || []
          }
        })

        console.log('Processed messages:', processedMessages)
        setMessages(processedMessages)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching messages:', error)
        setLoading(false)
      }
    }

    fetchMessages()

    // Existing subscriptions
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
      attachmentsSubscription.unsubscribe()
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