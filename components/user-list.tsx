'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const supabase = createClient()

interface User {
  id: string
  display_name: string | null
  last_seen: string | null
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false
    // Consider user online if seen in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return new Date(lastSeen) > fiveMinutesAgo
  }

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, last_seen')
        .order('display_name')

      setUsers(data || [])
    }

    fetchUsers()

    const channel = supabase
      .channel('profiles_updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <div className={`p-4 bg-gray-900/50 border-l border-gray-800 ${inter.className}`}>
      <h2 className="text-xl font-semibold mb-6 text-gray-100">Users</h2>
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors duration-200">
            <div 
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline(user.last_seen) 
                  ? 'bg-green-500 shadow-sm shadow-green-500/50' 
                  : 'bg-gray-500'
              }`}
            />
            <span className="text-gray-200">{user.display_name || 'Anonymous'}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 