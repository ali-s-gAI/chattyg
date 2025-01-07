'use client'

import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { MessageArea } from '@/components/message-area'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { CreateChannelModal } from '@/components/create-channel-modal'

const supabase = createClient()

type Channel = {
  id: string
  name: string
  description: string
  created_at: string
}

const ChatPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null)

  useEffect(() => {
    fetchChannels()

    const channel = supabase
      .channel('channels')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'channels' },
        (payload) => {
          setChannels(current => [...current, payload.new as Channel])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching channels:', error)
      return
    }

    setChannels(data)
    if (data.length > 0 && !currentChannelId) {
      setCurrentChannelId(data[0].id)
    }
  }

  const handleCreateChannelSuccess = () => {
    setIsCreateModalOpen(false)
    fetchChannels()
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Channels sidebar */}
      <div className="w-[240px] flex-shrink-0 bg-[#1E2124] text-white border-r border-gray-700">
        <Sidebar 
          channels={channels}
          currentChannelId={currentChannelId}
          onChannelSelect={setCurrentChannelId}
          onCreateChannel={() => setIsCreateModalOpen(true)} 
        />
      </div>

      {/* Users list */}
      <div className="w-[240px] flex-shrink-0 bg-[#282B30] text-gray-300 border-r border-gray-700">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Users</h2>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-[#36393E]">
        {currentChannelId ? (
          <>
            <div className="h-14 border-b border-gray-700 flex items-center px-4">
              <TopBar channel={channels.find(c => c.id === currentChannelId)} />
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessageArea channelId={currentChannelId} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            {channels.length === 0 
              ? "No channels exist. Create one to get started!"
              : "Select a channel to start chatting"}
          </div>
        )}
      </div>

      <CreateChannelModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateChannelSuccess}
      />
    </div>
  )
}

export default ChatPage

