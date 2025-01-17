import { MessageArea } from '@/components/message-area'
import { TopBar } from '@/components/top-bar'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChannelPage({
  params,
}: {
  params: { channelId: string }
}) {
  const { channelId } = params;
  const supabase = await createClient()
  
  // Fetch channel data
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single()

  return (
    <div className="flex-1 flex flex-col bg-[#36393E]">
      <div className="h-14 border-b border-gray-700 flex items-center px-4">
        <TopBar channel={channel} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <MessageArea channelId={channelId} />
      </div>
    </div>
  )
}