'use client'

import { useMessages } from '@/hooks/useMessages'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export function MessageArea({ channelId }: { channelId: string }) {
  const { messages, loading, sendMessage } = useMessages(channelId)
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await sendMessage(newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-gray-200 w-8 h-8" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">User</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center bg-gray-50 dark:bg-[#40444B] rounded-lg px-4 py-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-200 outline-none"
          />
          <button 
            type="submit"
            className="ml-2 text-blue-500"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

