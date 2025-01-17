'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Inter } from 'next/font/google'
import { UserDialog } from './user-dialog'

const inter = Inter({ subsets: ['latin'] })

const supabase = createClient()

interface User {
  id: string
  display_name: string | null
  last_seen: string | null
  avatar_url: string | null
}

const CHATTYG_ID = 'a7756e85-e983-464e-843b-f74e3e34decd'

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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
        .select('id, display_name, last_seen, avatar_url')
        .order('display_name')

        if (data) {
          // Separate ChattyG from other users
          const chattyG = data.find(user => user.id === CHATTYG_ID)
          const otherUsers = data.filter(user => user.id !== CHATTYG_ID)
          
          // Set users with ChattyG first, followed by alphabetically sorted others
          setUsers(chattyG ? [chattyG, ...otherUsers] : otherUsers)
        } else {
          setUsers([])
        }
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

  const getStatusColor = (userId: string, isUserOnline: boolean) => {
    if (userId === CHATTYG_ID) {
      return 'bg-orange-500 shadow-sm shadow-orange-500/50'
    }
    return isUserOnline 
      ? 'bg-green-500 shadow-sm shadow-green-500/50' 
      : 'bg-gray-500'
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-semibold">Users</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {users.map(user => (
            <div 
              key={user.id} 
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
              onClick={() => handleUserClick(user)}
            >
              <div 
                className={`w-2.5 h-2.5 rounded-full ${
                  getStatusColor(user.id, isOnline(user.last_seen))
                }`}
              />
              <span className="text-gray-200">{user.display_name || 'Anonymous'}</span>
            </div>
          ))}
        </div>
      </div>
      <UserDialog 
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
} 