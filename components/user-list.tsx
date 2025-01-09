'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

const supabase = createClient()

interface User {
  id: string
  display_name: string
  online: boolean
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get channelId from URL
  const pathname = usePathname()
  const channelId = pathname.startsWith('/chat/') ? pathname.split('/').pop() : null

  useEffect(() => {
    if (!channelId) {
      setUsers([])
      setIsLoading(false)
      return
    }

    // Initial fetch of users
    fetchChannelMembers()

    // Set up real-time subscription
    const channel = supabase
      .channel(`channel:${channelId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'channel_members' },
        () => {
          console.log('Channel members changed, refreshing...')
          fetchChannelMembers()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [channelId])

  const fetchChannelMembers = async () => {
    if (!channelId) return

    try {
      setIsLoading(true)
      
      const { data: members, error: membersError } = await supabase
        .from('channel_members')
        .select(`
          user_id,
          profiles!user_id (*)
        `)
        .eq('channel_id', channelId)

      if (membersError) throw membersError

      const formattedUsers = members
        ?.filter(member => member.profiles)
        .map(member => ({
          id: member.user_id,
          display_name: (member.profiles as { display_name: string | null }).display_name || 'Anonymous',
          online: true // You can implement real online status later
        })) || []

      setUsers(formattedUsers)
      setError(null)

    } catch (err) {
      console.error('Error fetching members:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Loading users...</h2>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Users ({users.length})</h2>
      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}
      <ul className="space-y-2">
        {users.map(user => (
          <li 
            key={user.id} 
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-700/50 cursor-pointer"
          >
            <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span>{user.display_name}</span>
          </li>
        ))}
        {users.length === 0 && (
          <li className="text-gray-400 text-sm">No users in this channel</li>
        )}
      </ul>
    </div>
  )
} 