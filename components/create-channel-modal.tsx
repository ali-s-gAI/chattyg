 'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X } from 'lucide-react'

type CreateChannelModalProps = {
  isOpen: boolean
  onClose: () => void
}

const supabase = createClient()

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Create the channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert([{
          name,
          description,
          is_private: isPrivate,
          created_by: session.user.id
        }])
        .select()
        .single()

      if (channelError) throw channelError

      // Add creator as channel admin
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([{
          channel_id: channel.id,
          user_id: session.user.id,
          role: 'admin'
        }])

      if (memberError) throw memberError

      setName('')
      setDescription('')
      setIsPrivate(false)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create channel')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-md w-[440px] shadow-lg">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">Create Channel</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              CHANNEL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md 
                       border border-gray-300 dark:border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              DESCRIPTION
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Let people know what this channel is about"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md 
                       border border-gray-300 dark:border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="isPrivate" className="text-sm dark:text-white">
              Private Channel
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white 
                       bg-blue-500 hover:bg-blue-600 rounded-md"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}