'use client'

import { useState } from 'react'
import { Search, Loader2, Hash, User, Paperclip, MessageSquare, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TopBarProps = {
  channel?: {
    id: string
    name: string
    description: string
    created_at: string
  }
}

export function TopBar({ channel }: TopBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { searchResults, isSearching, search } = useSearch()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await search(searchQuery)
    setIsDialogOpen(true)
  }

  const handleResultClick = (result: any) => {
    setIsDialogOpen(false)
    if (result.url) {
      router.push(result.url)
    } else if (result.channelId) {
      if (result.messageId) {
        router.push(`/chat/${result.channelId}?messageId=${result.messageId}`)
      } else {
        router.push(`/chat/${result.channelId}`)
      }
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <h2 className="text-xl font-semibold">
          #{channel ? channel.name : 'Select a channel'}
        </h2>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[300px] pr-20 bg-gray-800/50 border-gray-700 
                  text-gray-100 placeholder:text-gray-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  type="submit" 
                  size="icon"
                  variant="ghost" 
                  className="h-6 w-6"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Search Results</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="messages">
            <TabsList>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="channels" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Files
              </TabsTrigger>
            </TabsList>

            {['messages', 'channels', 'users', 'attachments'].map((category) => (
              <TabsContent key={category} value={category}>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {searchResults[category].map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 
                        transition-colors text-left"
                    >
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{result.title}</span>
                        {result.timestamp && (
                          <span>{format(new Date(result.timestamp), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-300">{result.subtitle}</p>
                    </button>
                  ))}
                  {searchResults[category].length === 0 && (
                    <p className="text-center text-gray-400 py-4">
                      No {category} found
                    </p>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

