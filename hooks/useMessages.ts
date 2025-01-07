'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient()

export type Message = {
  id: string
  content: string
  channel_id: string
  user_id: string
  created_at: string
  parent_id?: string
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: RealtimeChannel

    const fetchMessages = async () => {
      try {
        // Fetch existing messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })

        if (error) throw error
        setMessages(data || [])
        setLoading(false)

        // Subscribe to new messages
        subscription = supabase
          .channel(`messages:${channelId}`)
          .on('postgres_changes', 
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `channel_id=eq.${channelId}`
            },
            (payload) => {
              setMessages(current => [...current, payload.new as Message])
            }
          )
          .subscribe()
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }

    fetchMessages()

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe()
    }
  }, [channelId])

  const sendMessage = async (content: string, parentId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content,
            channel_id: channelId,
            user_id: session.user.id,
            parent_id: parentId
          }
        ])

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return {
    messages,
    loading,
    sendMessage
  }
} 