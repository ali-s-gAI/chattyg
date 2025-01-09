'use client'

import { useMessages } from '@/hooks/useMessages'
import { formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ReactMarkdown from 'react-markdown'
import { Smile, Plus } from 'lucide-react'
import { useState } from 'react'

interface MessageGroup {
  profileId: string
  displayName: string | null
  avatarUrl: string | null
  messages: Array<{
    id: string
    content: string
    created_at: string
  }>
}

export function MessageArea({ channelId }: { channelId: string }) {
  const { messages, loading } = useMessages(channelId)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  
  if (loading) {
    return <div className="p-4">Loading messages...</div>
  }

  // Group messages by user and time (within 5 minutes)
  const messageGroups = messages.reduce<MessageGroup[]>((groups, message) => {
    const lastGroup = groups[groups.length - 1]
    
    if (
      lastGroup &&
      lastGroup.profileId === message.user_id &&
      differenceInMinutes(new Date(message.created_at), 
        new Date(lastGroup.messages[lastGroup.messages.length - 1].created_at)) < 5
    ) {
      lastGroup.messages.push({
        id: message.id,
        content: message.content,
        created_at: message.created_at
      })
    } else {
      groups.push({
        profileId: message.user_id,
        displayName: message.profiles?.display_name,
        avatarUrl: message.profiles?.avatar_url,
        messages: [{
          id: message.id,
          content: message.content,
          created_at: message.created_at
        }]
      })
    }
    return groups
  }, [])

  return (
    <div className="p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-gray-400">No messages yet</div>
      ) : (
        messageGroups.map((group, groupIndex) => (
          <div key={group.messages[0].id} className="group">
            <div className="flex items-start gap-3 hover:bg-gray-800/30 px-2 py-1 rounded">
              <Avatar className="h-10 w-10 mt-1">
                <AvatarImage src={group.avatarUrl || ''} />
                <AvatarFallback className="bg-gray-700 text-gray-300">
                  {group.displayName?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-200">
                    {group.displayName || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(group.messages[0].created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {group.messages.map(message => (
                    <div key={message.id} className="relative group/message">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                          className="text-gray-100 break-words"
                          components={{
                            // Customize markdown components
                            strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                            em: ({node, ...props}) => <span className="italic" {...props} />,
                            code: ({node, ...props}) => <code className="bg-gray-800 px-1 rounded" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Reaction buttons */}
                      <div className={`absolute right-0 top-0 -mt-2 transition-opacity duration-200 ${
                        showReactions === message.id ? 'opacity-100' : 'opacity-0 group-hover/message:opacity-100'
                      }`}>
                        <div className="flex gap-1 bg-gray-700 rounded-full p-1 shadow-lg">
                          <button 
                            className="p-1 hover:bg-gray-600 rounded-full"
                            onClick={() => setShowReactions(message.id)}
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                          <button className="p-1 hover:bg-gray-600 rounded-full">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}