"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { toast } from "sonner"

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
  balance: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
}

const SEPOLIA_CHAIN_ID = 11155111

// Global flag to prevent multiple simultaneous connection attempts
let isConnecting = false

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    balance: null,
    provider: null,
    signer: null,
  })

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()

      if (accounts.length > 0) {
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        const network = await provider.getNetwork()
        const balance = await provider.getBalance(address)

        setState({
          address,
          isConnected: true,
          isConnecting: false,
          chainId: Number(network.chainId),
          balance: ethers.formatEther(balance),
          provider,
          signer,
        })
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error)
    }
  }, [])

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask Required", {
        description: "Please install MetaMask to connect your wallet.",
      })
      return
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting || state.isConnecting) {
      toast("Connection in Progress", {
        description: "Please wait for the current connection attempt to complete.",
      })
      return
    }

    isConnecting = true
    setState((prev) => ({ ...prev, isConnecting: true }))

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // First, check if we already have permission without requesting
      let accounts: string[] = []
      try {
        // Use ethereum.request directly to check current accounts
        accounts = await window.ethereum.request({ method: 'eth_accounts' })
      } catch (error) {
        console.log("Could not get current accounts:", error)
        accounts = []
      }
      
      // If no accounts, request permission
      if (accounts.length === 0) {
        try {
          // Show a toast to guide the user
          toast("Connect Wallet", {
            description: "Please approve the connection request in MetaMask popup.",
          })
          
          accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        } catch (requestError: any) {
          if (requestError.code === -32002) {
            // MetaMask is already processing, wait and try to get accounts again
            toast.warning("MetaMask Busy", {
              description: "MetaMask is processing another request. Please complete it first.",
            })
            
            // Wait a bit and check if accounts become available
            await new Promise(resolve => setTimeout(resolve, 3000))
            try {
              accounts = await window.ethereum.request({ method: 'eth_accounts' })
            } catch {
              accounts = []
            }
            
            if (accounts.length === 0) {
              throw new Error("MetaMask connection is busy. Please close any pending MetaMask popups and try again.")
            }
          } else if (requestError.code === 4001) {
            // User rejected the request
            throw new Error("Connection was rejected. Please approve the connection in MetaMask to continue.")
          } else {
            throw requestError
          }
        }
      }

      if (accounts.length === 0) {
        throw new Error("No wallet accounts found. Please make sure MetaMask is unlocked and try again.")
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        toast.error("Wrong Network", {
          description: "Please switch to Sepolia testnet.",
        })

        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          })
          
          // Re-fetch network info after switch
          const newNetwork = await provider.getNetwork()
          setState({
            address,
            isConnected: true,
            isConnecting: false,
            chainId: Number(newNetwork.chainId),
            balance: ethers.formatEther(balance),
            provider,
            signer,
          })
        } catch (switchError: any) {
          console.error("Failed to switch network:", switchError)
          // Still connect even if network switch fails
          setState({
            address,
            isConnected: true,
            isConnecting: false,
            chainId: Number(network.chainId),
            balance: ethers.formatEther(balance),
            provider,
            signer,
          })
        }
      } else {
        setState({
          address,
          isConnected: true,
          isConnecting: false,
          chainId: Number(network.chainId),
          balance: ethers.formatEther(balance),
          provider,
          signer,
        })
      }

      toast.success("Wallet Connected", {
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      })
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      
      let errorMessage = "Failed to connect wallet. Please try again."
      
      // Handle specific error cases
      if (error.code === -32002) {
        errorMessage = "MetaMask is already processing a request. Please check MetaMask and try again."
      } else if (error.code === 4001) {
        errorMessage = "Connection was rejected. Please approve the connection in MetaMask."
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Connection timed out. Please try again."
      } else if (error.message?.includes('busy')) {
        errorMessage = error.message
      } else if (error.message?.includes('rejected')) {
        errorMessage = error.message  
      } else if (error.message?.includes('accounts')) {
        errorMessage = error.message
      } else if (error.message?.includes('Already processing')) {
        errorMessage = "Another connection is in progress. Please wait and try again."
      }
      
      setState((prev) => ({ ...prev, isConnecting: false }))
      toast.error("Connection Failed", {
        description: errorMessage,
      })
    } finally {
      isConnecting = false
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      balance: null,
      provider: null,
      signer: null,
    })
    // Reset global connection flag
    isConnecting = false
    toast("Wallet Disconnected", {
      description: "Your wallet has been disconnected.",
    })
  }, [])

  const resetConnectionState = useCallback(() => {
    isConnecting = false
    setState((prev) => ({ ...prev, isConnecting: false }))
    toast("Connection State Reset", {
      description: "Connection state has been reset. You can try connecting again.",
    })
  }, [])

  useEffect(() => {
    checkConnection()

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", checkConnection)
      window.ethereum.on("chainChanged", () => window.location.reload())
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", checkConnection)
        window.ethereum.removeListener("chainChanged", () => {})
      }
    }
  }, [checkConnection])

  const isWrongNetwork = state.chainId !== null && state.chainId !== SEPOLIA_CHAIN_ID

  return {
    ...state,
    connect,
    disconnect,
    resetConnectionState,
    isWrongNetwork,
  }
}
