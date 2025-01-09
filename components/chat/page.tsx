import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageArea } from '@/components/message-area'
import { TopBar } from '@/components/top-bar'

const ChatPage: React.FC = () => {
  const [isCurrentUserMember, setIsCurrentUserMember] = useState(false)
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null)

  const checkMembership = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !currentChannelId) return false

    const { data, error } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', currentChannelId)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Error checking membership:', error)
      return false
    }

    setIsCurrentUserMember(!!data)
    return !!data
  }

  const handleJoinChannel = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !currentChannelId) return

    try {
      const { error } = await supabase
        .from('channel_members')
        .insert([{
          channel_id: currentChannelId,
          user_id: session.user.id,
          role: 'member'
        }])

      if (error) throw error
      setIsCurrentUserMember(true)
    } catch (error) {
      console.error('Error joining channel:', error)
      // Add appropriate error handling/user feedback
    }
  }

  return (
    <div>
      {currentChannelId ? (
        <>
          {isCurrentUserMember ? (
            <>
              <div className="h-14 border-b border-gray-700 flex items-center px-4">
                <TopBar channel={channels.find(c => c.id === currentChannelId)} />
              </div>
              <div className="flex-1 overflow-y-auto">
                <MessageArea channelId={currentChannelId} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-gray-400 mb-4">You're not a member of this channel</p>
              <button
                onClick={handleJoinChannel}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Join Channel
              </button>
            </div>
          )}
        </>
      ) : (
        // ... existing "no channel selected" state
      )}
    </div>
  )
}

export default ChatPage 