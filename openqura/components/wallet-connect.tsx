"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, LogOut, ExternalLink, AlertTriangle, Loader2 } from "lucide-react"
import { useWallet } from "@/lib/use-wallet"

export function WalletConnect() {
  const { address, isConnected, isConnecting, connect, disconnect, resetConnectionState, isWrongNetwork, balance } = useWallet()

  if (isConnecting) {
    return (
      <div className="flex gap-2">
        <Button disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Connecting...</span>
          <span className="sm:hidden">...</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetConnectionState}
          className="px-2"
          title="Reset connection if stuck"
        >
          Reset
        </Button>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <Button 
          onClick={connect} 
          className="gap-2 glow-primary"
          disabled={isConnecting}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </Button>
        {isConnecting && (
          <div className="text-xs text-muted-foreground text-center">
            Check for MetaMask popup
          </div>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 glass-card bg-transparent">
          {isWrongNetwork && <AlertTriangle className="h-4 w-4 text-destructive" />}
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 glass-card">
        <div className="p-3 space-y-2">
          <p className="text-sm text-muted-foreground">Connected Wallet</p>
          <p className="font-mono text-sm break-all">{address}</p>
          {balance && (
            <Badge variant="secondary" className="font-mono">
              {Number.parseFloat(balance).toFixed(4)} ETH
            </Badge>
          )}
          {isWrongNetwork && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Wrong Network
            </Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href={`https://sepolia.etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Etherscan
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
