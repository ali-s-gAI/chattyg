'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ThreadSection } from './thread-section'
import { Reply, ChevronRight, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageProps {
  message: {
    id: string
    content: string
    created_at: string
    reactions: any[]
    thread_count: number
    file_attachments?: Array<{
      file_url: string
      file_name: string
      file_type: string
      file_size: number
    }>
  }
  channelId: string
  displayName?: string | null
  onReplyClick: () => void
}

export function Message({ message, channelId, displayName, onReplyClick }: MessageProps) {
  console.log("Message data:", message);
  const [isThreadOpen, setIsThreadOpen] = useState(false)

  const toggleThread = () => {
    setIsThreadOpen(!isThreadOpen)
    onReplyClick()
  }

  return (
    <div>
      <div className="group relative hover:bg-gray-700/30 p-2 rounded">
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        {message.file_attachments?.map((file) => (
          <div key={file.file_url} className="mt-2">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
            >
              <Paperclip className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{file.file_name}</span>
              <span className="text-gray-500 text-xs">
                ({Math.round(file.file_size / 1024)}KB)
              </span>
            </a>
          </div>
        ))}
        
        <div className="flex items-center gap-2 mt-1">
          {/* Your existing reactions UI here */}
          
          <button
            onClick={onReplyClick}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity flex items-center gap-1 text-xs"
          >
            <Reply size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
          {message.thread_count > 0 && (
            <button
              onClick={toggleThread}
              className="flex items-center gap-1 hover:text-gray-200"
            >
              <ChevronRight 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isThreadOpen && "rotate-90"
                )}
              />
              <span>
                {message.thread_count} {message.thread_count === 1 ? 'reply' : 'replies'}
              </span>
            </button>
          )}
          
          <button
            onClick={onReplyClick}
            className="opacity-0 group-hover:opacity-100 hover:text-gray-200 transition-opacity"
          >
            Reply
          </button>
        </div>
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