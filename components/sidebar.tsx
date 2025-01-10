'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { CreateChannelModal } from '@/components/create-channel-modal'
import { SignOutButton } from '@/components/sign-out-button'

export function Sidebar({ channels }: { channels: Array<{ id: string; name: string }> }) {
  const pathname = usePathname()
  const currentChannelId = pathname.split('/').pop()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleCreateChannelSuccess = () => {
    setIsCreateModalOpen(false)
    // The channels will update automatically through Supabase real-time subscription
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2>Channels</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="text-gray-400 hover:text-white"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {channels.map(channel => (
            <li key={channel.id}>
              <Link
                href={`/chat/${channel.id}`}
                className={`block px-2 py-1 rounded cursor-pointer hover:bg-gray-700 ${
                  channel.id === currentChannelId ? 'bg-gray-700' : ''
                }`}
              >
                # {channel.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <SignOutButton />
        <Link 
          href="/settings/account" 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-md hover:bg-gray-700/50"
        >
          <Settings size={20} />
          <span>Account Settings</span>
        </Link>
      </div>

      <CreateChannelModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateChannelSuccess}
      />
    </div>
  )
}

