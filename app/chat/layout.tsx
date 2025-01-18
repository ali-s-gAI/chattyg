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
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <nav className="w-64 flex-shrink-0 border-r border-gray-800">
          <Sidebar channels={channels ?? []} />
        </nav>
        <main className="flex-1 flex overflow-hidden">
          {children}
        </main>
        <aside className="w-64 flex-shrink-0 border-l border-gray-800">
          <UserList />
        </aside>
      </div>
    </div>
  )
}
