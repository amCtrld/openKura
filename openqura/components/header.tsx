"use client"

import Link from "next/link"
import { Vote, LayoutDashboard } from "lucide-react"
import { WalletConnect } from "./wallet-connect"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-1 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
            <Image src="/logo.png" alt="openKura Logo" width={32} height={32} className="relative" />
          </div>
          <span className="text-xl font-bold text-white">openKura</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </Link>
          </Button>
          <WalletConnect />
        </nav>
      </div>
    </header>
  )
}
