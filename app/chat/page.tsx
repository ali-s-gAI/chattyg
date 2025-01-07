'use client'

import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { MessageArea } from '@/components/message-area'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import { CreateChannelModal } from '@/components/create-channel-modal'

const supabase = createClient()

export default function ChatPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/')
      }
    })
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onCreateChannel={() => setIsCreateModalOpen(true)} />
      <main className="flex flex-col flex-1">
        <TopBar />
        <MessageArea />
      </main>

      <CreateChannelModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}

