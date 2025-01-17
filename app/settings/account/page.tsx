'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UploadButton } from '@/utils/uploadthing'
import { X } from 'lucide-react'

const supabase = createClient()

export default function AccountSettings() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
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
      setAvatarUrl(profile.avatar_url)
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
        .update({ 
          display_name: displayName,
          avatar_url: avatarUrl
        })
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

  const handleRemoveAvatar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', session.user.id)

      if (error) throw error
      setAvatarUrl(null)
      setMessage('Avatar removed successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar')
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Profile Picture</label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || ''} />
              <AvatarFallback className="bg-gray-700 text-gray-300 text-xl">
                {displayName?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <UploadButton
                endpoint="avatarUploader"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    setAvatarUrl(res[0].url)
                    setMessage('Avatar uploaded successfully')
                  }
                }}
                onUploadError={(error: Error) => {
                  setError(`Error uploading avatar: ${error.message}`)
                }}
              />
              {avatarUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

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