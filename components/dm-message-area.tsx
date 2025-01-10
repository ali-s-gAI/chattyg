"use client";

import { useDirectMessages } from "@/hooks/useDirectMessages";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useState, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageGroup {
  senderId: string;
  displayName: string | null;
  avatarUrl: string | null;
  messages: Array<{
    id: string;
    content: string;
    created_at: string;
  }>;
}

export function DmMessageArea({ targetUserId }: { targetUserId: string }) {
  const { messages, loading, sendDM } = useDirectMessages(targetUserId);
  const [messageInput, setMessageInput] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      console.log("Attempting to send DM:", messageInput);
      await sendDM(messageInput);
      console.log("DM sent successfully");
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading messages...</div>;
  }

  // Group messages by user and time (within 5 minutes)
  const messageGroups = messages.reduce<MessageGroup[]>((groups, message) => {
    const lastGroup = groups[groups.length - 1];
    
    if (
      lastGroup &&
      lastGroup.senderId === message.sender_id &&
      differenceInMinutes(new Date(message.created_at), 
        new Date(lastGroup.messages[lastGroup.messages.length - 1].created_at)) < 5
    ) {
      lastGroup.messages.push({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
      });
    } else {
      groups.push({
        senderId: message.sender_id,
        displayName: message.sender_profile?.display_name,
        avatarUrl: message.sender_profile?.avatar_url,
        messages: [{
          id: message.id,
          content: message.content,
          created_at: message.created_at,
        }]
      });
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area with scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-gray-400">No messages yet</div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.messages[0].id} className="group">
              <div className="flex items-start gap-3 hover:bg-gray-800/30 px-2 py-1 rounded">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarImage src={group.avatarUrl || ""} />
                  <AvatarFallback className="bg-gray-700 text-gray-300">
                    {group.displayName?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-200">
                      {group.displayName || "Anonymous"}
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
                            {format(new Date(group.messages[0].created_at), "EEEE, MMMM d, yyyy, h:mm:ss aa")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="space-y-1">
                    {group.messages.map(message => (
                      <div key={message.id}>
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown
                            className="text-gray-100 break-words"
                            components={{
                              strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                              em: ({node, ...props}) => <span className="italic" {...props} />,
                              code: ({node, ...props}) => <code className="bg-gray-800 px-1 rounded" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
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
            placeholder="Send a direct message..."
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
  );
} 