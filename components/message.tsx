import { useState } from 'react'
import { format } from 'date-fns'
import { ThreadSection } from './thread-section'
import { Reply } from 'lucide-react'

interface MessageProps {
  message: {
    id: string
    content: string
    created_at: string
    reactions: any[]
    thread_count: number
  }
  channelId: string
  displayName?: string | null
}

export function Message({ message, channelId, displayName }: MessageProps) {
  const [isThreadOpen, setIsThreadOpen] = useState(false)

  return (
    <div>
      <div className="group relative hover:bg-gray-700/30 p-2 rounded">
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        <div className="flex items-center gap-2 mt-1">
          {/* Your existing reactions UI here */}
          
          <button
            onClick={() => setIsThreadOpen(true)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity flex items-center gap-1 text-xs"
          >
            <Reply size={14} />
            {message.thread_count > 0 && (
              <span>{message.thread_count}</span>
            )}
          </button>
        </div>

        {message.thread_count > 0 && !isThreadOpen && (
          <button
            onClick={() => setIsThreadOpen(true)}
            className="text-xs text-gray-400 hover:text-white mt-1 flex items-center gap-1"
          >
            {message.thread_count} {message.thread_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
      
      {isThreadOpen && (
        <ThreadSection 
          channelId={channelId}
          parentMessageId={message.id}
          onClose={() => setIsThreadOpen(false)}
        />
      )}
    </div>
  )
} 