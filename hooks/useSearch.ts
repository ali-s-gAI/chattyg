'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

const supabase = createClient()

interface SearchResult {
  type: 'message' | 'channel' | 'user' | 'attachment'
  id: string
  title: string
  subtitle: string
  channelId?: string
  messageId?: string
  timestamp?: string
  url?: string
}

interface Profile {
  id: string
  display_name: string
  email?: string
}

interface Message {
  id: string
  content: string
  channel_id: string
  created_at: string
  profiles: {
    id: string
    display_name: string
  }
}

interface Channel {
  id: string
  name: string
  description?: string
}

interface FileAttachment {
  id: string
  file_name: string
  message_id: string
  channel_id: string
  created_at: string
}

export function useSearch() {
  const [searchResults, setSearchResults] = useState<{
    messages: SearchResult[]
    channels: SearchResult[]
    users: SearchResult[]
    attachments: SearchResult[]
  }>({
    messages: [],
    channels: [],
    users: [],
    attachments: []
  })
  const [isSearching, setIsSearching] = useState(false)

  const search = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ messages: [], channels: [], users: [], attachments: [] })
      return
    }

    setIsSearching(true)
    try {
      const [messages, channels, users, attachments] = await Promise.all([
        // Messages search
        supabase
          .from('messages')
          .select(`
            id,
            content,
            channel_id,
            created_at,
            profiles:user_id (
              id,
              display_name
            )
          `)
          .ilike('content', `%${query}%`)
          .limit(5),

        // Channels search
        supabase
          .from('channels')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(5),

        // Users search
        supabase
          .from('profiles')
          .select('*')
          .ilike('display_name', `%${query}%`)
          .limit(5),

        // Attachments search
        supabase
          .from('file_attachments')
          .select(`
            id,
            file_name,
            message_id,
            channel_id,
            created_at
          `)
          .ilike('file_name', `%${query}%`)
          .limit(5)
      ])

      setSearchResults({
        messages: messages.data?.map(msg => {
          const message = msg as unknown as Message
          return {
            type: 'message',
            id: message.id,
            title: message.profiles?.display_name || 'Unknown User',
            subtitle: message.content,
            channelId: message.channel_id,
            messageId: message.id,
            timestamp: message.created_at
          }
        }) || [],
        channels: channels.data?.map(channel => ({
          type: 'channel',
          id: channel.id,
          title: channel.name,
          subtitle: channel.description || 'No description',
          channelId: channel.id
        })) || [],
        users: users.data?.map(user => ({
          type: 'user',
          id: user.id,
          title: user.display_name,
          subtitle: user.email || 'No email',
          url: `/chat/dm/${user.id}`
        })) || [],
        attachments: attachments.data?.map(file => ({
          type: 'attachment',
          id: file.id,
          title: file.file_name,
          subtitle: 'File attachment',
          channelId: file.channel_id,
          messageId: file.message_id,
          timestamp: file.created_at
        })) || []
      })
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults({ messages: [], channels: [], users: [], attachments: [] })
    } finally {
      setIsSearching(false)
    }
  }

  return {
    searchResults,
    isSearching,
    search
  }
} 