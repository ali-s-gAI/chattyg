import { Sidebar } from '@/components/sidebar'
import { UserList } from '@/components/user-list'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth-pages/sign-in')
  }

  // Fetch channels server-side
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="flex h-screen bg-white">
      <div className="w-[240px] flex-shrink-0 bg-[#1E2124] text-white border-r border-gray-700">
        <Sidebar channels={channels || []} />
      </div>
      <div className="w-[240px] flex-shrink-0 bg-[#282B30] text-gray-300 border-r border-gray-700">
        <UserList />
      </div>
      {children}
    </div>
  )
}
