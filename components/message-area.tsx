'use client'

import { useMessages } from '@/hooks/useMessages'
import { formatDistanceToNow, differenceInMinutes, format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import ReactMarkdown from 'react-markdown'
import { Smile, Plus, Send, Reply, Paperclip } from 'lucide-react'
import { useState, FormEvent } from 'react'
import { ThreadSection } from '@/components/thread-section'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { createClient } from '@/utils/supabase/client'
import { UserDialog } from "@/components/user-dialog"
import { FileUpload } from "./ui/file-upload"

const supabase = createClient()

interface MessageGroup {
  profileId: string
  displayName: string | null
  avatarUrl: string | null
  messages: Array<{
    id: string
    content: string
    created_at: string
    thread_count: number
    reactions: any[]
    file_attachments?: Array<{
      file_url: string
      file_name: string
      file_type: string
      file_size: number
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
  thread_count: number
  profiles?: {
    display_name: string | null
    avatar_url: string | null
  }
  reactions: any[]
  file_attachments?: Array<{
    file_url: string
    file_name: string
    file_type: string
    file_size: number
  }>
}

export function MessageArea({ channelId }: { channelId: string }) {
  const { messages, loading, sendMessage } = useMessages(channelId)
  const [messageInput, setMessageInput] = useState('')
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [isThreadOpen, setIsThreadOpen] = useState<string | null>(null)
  const [threadOpenForMessage, setThreadOpenForMessage] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [attachment, setAttachment] = useState<{
    url: string;
    type: string;
    name: string;
    size: number;
  } | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !attachment) return;

    try {
      console.log("Submitting with attachment:", attachment); // Debug log

      // Send the message first
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([{
          content: messageInput,
          channel_id: channelId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      // If there's an attachment, create the file attachment record
      if (attachment) {
        console.log("Creating file attachment with:", { // Debug log
          message_id: message.id,
          file_url: attachment.url,
          file_name: attachment.name,
          file_type: attachment.type,
          file_size: attachment.size,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

        const { data: fileAttachment, error: attachmentError } = await supabase
          .from('file_attachments')
          .insert([{
            message_id: message.id,
            file_url: attachment.url,
            file_name: attachment.name,
            file_type: attachment.type,
            file_size: attachment.size,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }])
          .select()
          .single();

        console.log("File attachment result:", { fileAttachment, attachmentError }); // Debug log

        if (attachmentError) throw attachmentError;
      }

      setMessageInput("");
      setAttachment(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

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
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', session.user.id)
          .eq('emoji', emoji)

        if (deleteError) throw deleteError
      } else {
        // Add new reaction
        const { error: insertError } = await supabase
          .from('message_reactions')
          .insert([{
            message_id: messageId,
            user_id: session.user.id,
            emoji: emoji
          }])

        if (insertError) throw insertError
      }
    } catch (error) {
      console.error('Error handling emoji reaction:', error)
    }
  }

  const handleReply = async (messageId: string) => {
    setThreadOpenForMessage(messageId)
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
        thread_count: message.thread_count,
        reactions: message.reactions,
        file_attachments: message.file_attachments
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
          thread_count: message.thread_count,
          reactions: message.reactions,
          file_attachments: message.file_attachments
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
                    <button
                      onClick={() => {
                        setSelectedUser({
                          id: group.profileId,
                          display_name: group.displayName,
                          avatar_url: group.avatarUrl,
                        });
                        setDialogOpen(true);
                      }}
                      className="font-semibold text-gray-200 hover:underline"
                    >
                      {group.displayName || 'Anonymous'}
                    </button>
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
                          
                          {message.file_attachments?.map((file) => (
                            <div key={file.file_url} className="mt-2">
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                              >
                                <Paperclip className="h-4 w-4" />
                                <span className="truncate">{file.file_name}</span>
                                <span className="text-gray-500 text-xs">
                                  ({Math.round(file.file_size / 1024)}KB)
                                </span>
                              </a>
                            </div>
                          ))}
                        </div>
                        
                        {/* Reaction and Reply buttons */}
                        <div className={`absolute right-0 top-0 -mt-2 transition-opacity duration-200 ${
                          showEmojiPicker === message.id ? 'opacity-100' : 'opacity-0 group-hover/message:opacity-100'
                        }`}>
                          <div className="flex gap-2">
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

                            <button 
                              className="p-1 hover:bg-gray-600 rounded-full"
                              onClick={() => handleReply(message.id)}
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                          </div>
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

                        {threadOpenForMessage === message.id && (
                          <ThreadSection 
                            channelId={channelId}
                            parentMessageId={message.id}
                            onClose={() => setThreadOpenForMessage(null)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add the dialog */}
      <UserDialog 
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Message input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
          <FileUpload
            onUploadComplete={(url, type, name, size) => {
              console.log("Setting attachment:", { url, type, name, size }); // Debug log
              setAttachment({ url, type, name, size });
            }}
            onUploadError={(error) => {
              console.error("Upload failed:", error);
            }}
          />
          
          <div className="flex-1 relative">
            {attachment && (
              <div className="absolute -top-8 left-0 bg-gray-700 rounded px-2 py-1 text-sm flex items-center gap-2">
                <span className="truncate max-w-[200px]">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-gray-700/50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim() && !attachment}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}