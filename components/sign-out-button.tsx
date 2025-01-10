'use client'

import { createClient } from '@/utils/supabase/client'
import { updateUserLastSeen } from '@/utils/user-status'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

const supabase = createClient()

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await updateUserLastSeen() // Update last seen before signing out
    await supabase.auth.signOut()
    router.push('/auth-pages/sign-in')
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      size="sm"
      className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
} 