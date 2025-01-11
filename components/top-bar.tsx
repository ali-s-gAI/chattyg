'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type TopBarProps = {
  channel?: {
    id: string
    name: string
    description: string
    created_at: string
  }
}

export function TopBar({ channel }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    // We'll implement this next
  }

  return (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-xl font-semibold">
        #{channel ? channel.name : 'Select a channel'}
      </h2>
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="search"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[200px] bg-gray-800/50 border-gray-700 text-gray-100 
              placeholder:text-gray-400 focus:ring-blue-500/50"
          />
          <Button 
            type="submit" 
            size="icon"
            variant="ghost" 
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

