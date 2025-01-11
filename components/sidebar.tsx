'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, LogOut, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { CreateChannelModal } from '@/components/create-channel-modal'
import { SignOutButton } from '@/components/sign-out-button'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

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
      <div className="p-4">
        <h2 className="text-xl font-semibold">Channels</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="p-2 hover:bg-gray-700/50 rounded-full transition-colors duration-200 text-gray-400 hover:text-white"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {channels.map(channel => (
            <li key={channel.id}>
              <Link
                href={`/chat/${channel.id}`}
                className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
                  channel.id === currentChannelId 
                    ? 'bg-gray-700/70 text-white' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <span className="text-gray-400 mr-2">#</span>
                {channel.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t border-gray-800 space-y-2">
        <SignOutButton className="w-full" />
        <Link 
          href="/settings/account" 
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2.5 rounded-md hover:bg-gray-700/50 w-full"
        >
          <Settings size={18} />
          <span>Settings</span>
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

