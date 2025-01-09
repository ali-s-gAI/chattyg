'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

interface User {
  id: string
  display_name: string
  online: boolean
}

interface UserListProps {
  channelId: string | null
}

export function UserList({ channelId }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    try {
      setIsLoading(true)
      
      // Get all channel members with their profiles in a single query
      const { data: members, error: membersError } = await supabase
        .from('channel_members')
        .select(`
          user_id,
          profiles:user_id (
            id,
            display_name
          )
        `)
        .eq('channel_id', channelId)

      console.log('Channel members query result:', { members, membersError })

      if (membersError) throw membersError

      if (!members || members.length === 0) {
        setUsers([])
        return
      }

      // Format the users array
      const formattedUsers = members
        .filter(member => member.profiles) // Filter out any null profiles
        .map(member => ({
          id: member.profiles.id,
          display_name: member.profiles.display_name || 'Anonymous',
          online: true // We'll handle online status separately
        }))

      console.log('Formatted users:', formattedUsers)
      setUsers(formattedUsers)
      setError(null)

    } catch (err) {
      const error = err as Error
      console.error('Detailed error:', error)
      setError(`Error: ${error.message}`)
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
      {/* <pre className="text-xs text-gray-500 mb-4">
        Debug: Channel {channelId}
      </pre> */}
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