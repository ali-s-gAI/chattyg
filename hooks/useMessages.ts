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
  parent_id?: string | null
  profiles: {
    display_name: string | null
  } | null
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: RealtimeChannel

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              display_name
            )
          `)
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
            async (payload) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', payload.new.user_id)
                .single()
              
              const newMessage: Message = {
                ...payload.new,
                profiles: profile
              }
              
              setMessages(current => [...current, newMessage])
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