'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function AccountSettings() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth-pages/sign-in')
        return
      }

      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        setError('Error loading profile')
        return
      }

      setDisplayName(profile.display_name || '')
      setEmail(session.user.email || '')
      setIsLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', session.user.id)

      if (profileError) throw profileError

      // Update email if changed
      if (email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        })
        if (emailError) throw emailError
      }

      setMessage('Settings updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {message && (
          <div className="text-green-500 text-sm">{message}</div>
        )}

        <Button 
          type="submit" 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
} 