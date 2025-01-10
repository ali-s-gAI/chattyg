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
  profiles?: {
    display_name: string | null
    avatar_url: string | null
  }
}

interface ThreadSectionProps {
  channelId: string
  parentMessageId: string
  onClose: () => void
}

export function ThreadSection({ channelId, parentMessageId, onClose }: ThreadSectionProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [messageInput, setMessageInput] = useState('')

  const fetchThreadMessages = async () => {
    try {
      console.log('Fetching thread messages for:', parentMessageId)
      const { data, error } = await supabase
        .from('thread_messages')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('parent_message_id', parentMessageId)
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log('Fetched thread messages:', data)
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching thread messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchThreadMessages()

    // Subscribe to new thread messages
    const channel = supabase
      .channel(`thread:${parentMessageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thread_messages',
          filter: `parent_message_id=eq.${parentMessageId}`
        },
        (payload) => {
          console.log('New thread message:', payload)
          setMessages(current => [...current, payload.new as ThreadMessage])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [parentMessageId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('thread_messages')
        .insert([{
          content: messageInput,
          channel_id: channelId,
          parent_message_id: parentMessageId,
          user_id: session.user.id
        }])

      if (error) throw error
      setMessageInput('')
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  return (
    <div className="pl-8 mt-2 mb-4 border-l-2 border-gray-700">
      {isLoading && messages.length === 0 ? (
        <div className="p-2 text-sm text-gray-400">Loading replies...</div>
      ) : (
        <>
          <div className="space-y-2 mb-2">
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
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Reply to thread..."
              className="flex-1 bg-gray-700/50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={!messageInput.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </>
      )}
    </div>
  )
} 