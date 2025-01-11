import { Sidebar } from '@/components/sidebar'
import { UserList } from '@/components/user-list'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'

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
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1">
        <nav className="w-64 border-r border-gray-800">
          <Sidebar channels={channels} />
        </nav>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
