'use client'

import { useMessages } from '@/hooks/useMessages'
import { formatDistanceToNow, differenceInMinutes, format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import ReactMarkdown from 'react-markdown'
import { Smile, Plus, Send } from 'lucide-react'
import { useState, FormEvent } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

interface MessageGroup {
  profileId: string
  displayName: string | null
  avatarUrl: string | null
  messages: Array<{
    id: string
    content: string
    created_at: string
    reactions?: Array<{
      emoji: string
      count: number
      reacted: boolean
    }>
  }>
}

interface Reaction {
  emoji: string
  count: number
  reacted: boolean
}

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: {
    display_name: string | null
  }
  reactions?: Array<{
    emoji: string
    count: number
    reacted: boolean
  }>
}

export function MessageArea({ channelId }: { channelId: string }) {
  const { messages, loading, sendMessage } = useMessages(channelId)
  const [messageInput, setMessageInput] = useState('')
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    try {
      await sendMessage(messageInput)
      setMessageInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleEmojiSelect = async (messageId: string, emoji: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Check if user already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', session.user.id)
        .eq('emoji', emoji)
        .single()

      if (existingReaction) {
        // Remove reaction if it exists
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', session.user.id)
          .eq('emoji', emoji)

        if (error) throw error
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert([{
            message_id: messageId,
            user_id: session.user.id,
            emoji: emoji
          }])

        if (error) throw error
      }
    } catch (error) {
      console.error('Error managing reaction:', error)
    }
  }

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
        created_at: message.created_at,
        reactions: message.reactions
      })
    } else {
      groups.push({
        profileId: message.user_id,
        displayName: message.profiles?.display_name,
        avatarUrl: message.profiles?.avatar_url,
        messages: [{
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          reactions: message.reactions
        }]
      })
    }
    return groups
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Messages area with scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-gray-400 cursor-default">
                            {formatDistanceToNow(new Date(group.messages[0].created_at), { addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent 
                          className="bg-gray-800 text-gray-100 border border-gray-700 px-3 py-1.5"
                          side="top"
                        >
                          <p className="text-xs whitespace-nowrap">
                            {format(new Date(group.messages[0].created_at), 'EEEE, MMMM d, yyyy, h:mm:ss aa')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                          showEmojiPicker === message.id ? 'opacity-100' : 'opacity-0 group-hover/message:opacity-100'
                        }`}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button 
                                className="p-1 hover:bg-gray-600 rounded-full"
                                onClick={() => setShowEmojiPicker(message.id)}
                              >
                                <Smile className="w-4 h-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none">
                              <Picker 
                                data={data}
                                onEmojiSelect={(emoji: any) => {
                                  handleEmojiSelect(message.id, emoji.native)
                                  setShowEmojiPicker(null)
                                }}
                                theme="dark"
                                previewPosition="none"
                                skinTonePosition="none"
                                searchPosition="top"
                                navPosition="bottom"
                                perLine={8}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Display reactions */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {console.log('Rendering reactions for message:', message.id, message.reactions)}
                          {message.reactions?.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={() => handleEmojiSelect(message.id, reaction.emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm 
                                ${reaction.reacted 
                                  ? 'bg-blue-500/50 hover:bg-blue-500/40' 
                                  : 'bg-gray-700/50 hover:bg-gray-600/50'
                                } transition-colors`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-xs text-gray-400">{reaction.count}</span>
                            </button>
                          ))}
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

      {/* Message input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
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
      </div>
    </div>
  )
}