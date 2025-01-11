'use client'

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Header() {
  const { theme, setTheme } = useTheme()

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
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="text-gray-400 hover:text-white"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    </header>
  )
} 