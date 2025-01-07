'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

type User = {
  id: string
  display_name: string
  online: boolean
}

type UserListProps = {
  channelId: string | null
}

export function UserList({ channelId }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!channelId) {
      console.log('No channelId provided')
      return
    }

    const fetchChannelMembers = async () => {
      try {
        // Log the current session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Current session:', session?.user.id)

        // First get channel members
        const { data: members, error: membersError } = await supabase
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', channelId)

        console.log('Channel members query:', { members, membersError })

        if (membersError) throw membersError

        if (!members || members.length === 0) {
          console.log('No members found in channel')
          setUsers([])
          return
        }

        // Then get profiles for these members
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', members.map(m => m.user_id))

        console.log('Profiles query:', { profiles, profilesError })

        if (profilesError) throw profilesError

        const formattedUsers = profiles.map(profile => ({
          id: profile.id,
          display_name: profile.display_name || 'Anonymous',
          online: true
        }))

        console.log('Formatted users:', formattedUsers)
        setUsers(formattedUsers)
        setError(null)

      } catch (error) {
        console.error('Detailed error:', error)
        setError(`Error: ${error.message || 'Unknown error'}`)
      }
    }

    fetchChannelMembers()
  }, [channelId])

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
            className="flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span>{user.display_name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
} 