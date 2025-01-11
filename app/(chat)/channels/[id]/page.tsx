import { createClient } from '@/utils/supabase/server'
import { MessageArea } from '@/components/message-area'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ChannelPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth-pages/sign-in')
  }

  return (
    <div className="flex-1 flex flex-col">
      <MessageArea channelId={params.id} />
    </div>
  )
} 