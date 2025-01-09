import { MessageArea } from '@/components/message-area'
import { TopBar } from '@/components/top-bar'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChannelPage({
  params: { channelId },
}: {
  params: { channelId: string }
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth-pages/sign-in')
  }

  return (
    <div className="flex-1 flex flex-col bg-[#36393E]">
      <div className="h-14 border-b border-gray-700 flex items-center px-4">
        <TopBar channelId={channelId} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <MessageArea channelId={channelId} />
      </div>
    </div>
  )
}