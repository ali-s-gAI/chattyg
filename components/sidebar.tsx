'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'

type SidebarProps = {
  channels: Array<{
    id: string
    name: string
    description: string
    created_at: string
  }>
  currentChannelId: string | null
  onChannelSelect: (channelId: string) => void
  onCreateChannel: () => void
}

export function Sidebar({ channels, currentChannelId, onChannelSelect, onCreateChannel }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2>Channels</h2>
        <button onClick={onCreateChannel} className="text-gray-400 hover:text-white">+</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {channels.map(channel => (
            <li 
              key={channel.id}
              onClick={() => onChannelSelect(channel.id)}
              className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-700 ${
                channel.id === currentChannelId ? 'bg-gray-700' : ''
              }`}
            >
              # {channel.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-700">
        <Link 
          href="/settings/account" 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-md hover:bg-gray-700/50"
        >
          <Settings size={20} />
          <span>Account Settings</span>
        </Link>
      </div>
    </div>
  )
}

