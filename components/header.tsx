'use client'

import Image from "next/image"

export function Header() {
  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Image
          src="/chattyG_logo.png"
          alt="ChattyG Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <span className="text-xl font-bold text-white">ChattyG</span>
      </div>
    </header>
  )
} 