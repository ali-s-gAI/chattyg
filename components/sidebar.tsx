'use client'

import { useState } from 'react'
import Link from 'next/link'

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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2>Channels</h2>
        <button onClick={onCreateChannel} className="text-gray-400 hover:text-white">+</button>
      </div>
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
  )
}

