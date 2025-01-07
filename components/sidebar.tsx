'use client'

import { useState } from 'react'
import Link from 'next/link'

type SidebarProps = {
  onCreateChannel: () => void
}

export function Sidebar({ onCreateChannel }: SidebarProps) {
  const [channels, setChannels] = useState<string[]>([])
  const [directMessages, setDirectMessages] = useState<string[]>([])

  const addChannel = () => {
    const channelName = prompt('Enter channel name:')
    if (channelName) setChannels([...channels, channelName])
  }

  const addDirectMessage = () => {
    const userName = prompt('Enter user name:')
    if (userName) setDirectMessages([...directMessages, userName])
  }

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-xl font-bold">ChatGenius</div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="px-2">
          <li className="mb-2">
            <Link href="/chat" className="block px-2 py-1 rounded hover:bg-gray-700">
              Home
            </Link>
          </li>
          <li className="mb-2">
            <div className="flex justify-between items-center px-2 py-1">
              <span>Channels</span>
              <button onClick={addChannel} className="text-gray-400 hover:text-white">+</button>
            </div>
            <ul className="ml-4">
              {channels.map((channel, index) => (
                <li key={index}>
                  <Link href={`/chat/channel/${channel}`} className="block px-2 py-1 rounded hover:bg-gray-700">
                    # {channel}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="mb-2">
            <div className="flex justify-between items-center px-2 py-1">
              <span>Direct Messages</span>
              <button onClick={addDirectMessage} className="text-gray-400 hover:text-white">+</button>
            </div>
            <ul className="ml-4">
              {directMessages.map((user, index) => (
                <li key={index}>
                  <Link href={`/chat/dm/${user}`} className="block px-2 py-1 rounded hover:bg-gray-700">
                    {user}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Link href="/chat/account" className="block px-2 py-1 rounded hover:bg-gray-700">
          Account
        </Link>
      </div>
    </div>
  )
}

