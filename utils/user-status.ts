import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export async function updateUserLastSeen() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user.id) return

  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', session.user.id)
} 