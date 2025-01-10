import { Sidebar } from '@/components/sidebar'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

async function getChannels() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name')
    .order('name')

  return channels || []
}

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const channels = await getChannels()

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <nav className="w-64 border-r border-gray-800">
        <Sidebar channels={channels} />
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 