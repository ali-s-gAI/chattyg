'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const supabase = createClient()

interface SignOutButtonProps {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    // Set last_seen to 10 minutes ago (outside our 5-minute window)
    const tenMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user.id) {
      await supabase
        .from('profiles')
        .update({ last_seen: tenMinutesAgo })
        .eq('id', session.user.id)
    }

    await supabase.auth.signOut()
    router.push('/auth-pages/sign-in')
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      size="sm"
      className={cn(
        "w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800",
        className
      )}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
} 