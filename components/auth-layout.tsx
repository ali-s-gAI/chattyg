'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { SignOutButton } from './sign-out-button'

const supabase = createClient()

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth-pages/sign-in')
        return
      }
      setIsAuthenticated(true)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        router.push('/auth-pages/sign-in')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <nav className="w-64 border-r border-gray-800 p-4 flex flex-col">
        {/* Your existing navigation */}
        <div className="mt-auto pt-4 border-t border-gray-800">
          <SignOutButton />
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 