'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { Send } from 'lucide-react'

const supabase = createClient()

interface ThreadMessage {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface ThreadSectionProps {
  channelId: string
  parentMessageId: string
  onClose: () => void
}

export function ThreadSection({ channelId, parentMessageId, onClose }: ThreadSectionProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchThreadMessages = async () => {
    try {
      console.log('Fetching thread messages for parent:', parentMessageId)
      
      // First get the thread messages
      const { data: threadMessages, error: threadError } = await supabase
        .from('thread_messages')
        .select('*')
        .eq('parent_message_id', parentMessageId)
        .order('created_at', { ascending: true })

      if (threadError) {
        console.error('Thread messages fetch error:', threadError)
        return
      }

      if (!threadMessages?.length) {
        setMessages([])
        return
      }

      // Then get the profiles for these messages
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', threadMessages.map(msg => msg.user_id))

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError)
        return
      }

      // Combine the data
      const messagesWithProfiles = threadMessages.map(message => ({
        ...message,
        profiles: profilesData?.find(profile => profile.id === message.user_id) || null
      }))

      console.log('Combined messages with profiles:', messagesWithProfiles)
      setMessages(messagesWithProfiles)
    } catch (error) {
      console.error('Catch block error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || isLoading) return

    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        return
      }

      // First, increment the thread_count of the parent message
      const { error: updateError } = await supabase.rpc('increment_thread_count', {
        message_id: parentMessageId
      })

      if (updateError) {
        console.error('Error updating thread count:', updateError)
        return
      }

      // Then insert the thread message
      const { error: insertError } = await supabase
        .from('thread_messages')
        .insert({
          content: messageInput.trim(),
          channel_id: channelId,
          parent_message_id: parentMessageId,
          user_id: session.user.id,
          is_edited: false,
          reactions: {}
        })

      if (insertError) {
        console.error('Send error:', insertError)
        return
      }

      setMessageInput('')
      await fetchThreadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchThreadMessages()

    const channel = supabase
      .channel('thread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thread_messages',
          filter: `parent_message_id=eq.${parentMessageId}`
        },
        () => {
          fetchThreadMessages()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [parentMessageId])

  return (
    <div className="pl-8 mt-2 mb-4 border-l-2 border-gray-700">
      <div className="flex flex-col gap-2">
        {messages.map(message => (
          <div key={message.id} className="p-2 hover:bg-gray-700/30 rounded">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {message.profiles?.display_name || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-400">
                {format(new Date(message.created_at), 'MMM d, h:mm a')}
              </span>
            </div>
            <div className="text-sm">{message.content}</div>
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white px-2"
          >
            ×
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Reply to thread..."
            className="flex-1 bg-gray-700/50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={!messageInput.trim() || isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
} 