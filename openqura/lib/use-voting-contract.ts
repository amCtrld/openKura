"use client"

import { useState, useCallback } from "react"
import { ethers } from "ethers"
import { getContract, RPC_URL, isContractConfigured } from "@/lib/contract"
import { useWallet } from "./use-wallet"
import { toast } from "sonner"

interface TransactionState {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  hash: string | null
  error: string | null
}

export function useVotingContract() {
  const { signer, isConnected, address } = useWallet()
  const [txState, setTxState] = useState<TransactionState>({
    isPending: false,
    isSuccess: false,
    isError: false,
    hash: null,
    error: null,
  })

  const resetTxState = useCallback(() => {
    setTxState({
      isPending: false,
      isSuccess: false,
      isError: false,
      hash: null,
      error: null,
    })
  }, [])

  const vote = useCallback(
    async (electionId: number) => {
      if (!isContractConfigured()) {
        toast.error("Contract Not Configured", {
          description: "Smart contract address is not configured. Running in demo mode.",
        })
        return false
      }

      if (!signer || !isConnected) {
        toast.error("Wallet Not Connected", {
          description: "Please connect your wallet to vote.",
        })
        return false
      }

      setTxState({ isPending: true, isSuccess: false, isError: false, hash: null, error: null })

      try {
        const contract = getContract(signer)
        
        // Check if user has already voted
        const alreadyVoted = await contract.hasVoted(electionId, address)
        if (alreadyVoted) {
          setTxState({ isPending: false, isSuccess: false, isError: true, hash: null, error: "Already voted" })
          toast.error("Already Voted", {
            description: "You have already voted in this election.",
          })
          return false
        }

        const tx = await contract.vote(electionId)
        toast.success("Transaction Submitted", {
          description: "Your vote transaction has been submitted to the blockchain.",
        })

        const receipt = await tx.wait()
        setTxState({ isPending: false, isSuccess: true, isError: false, hash: receipt.hash, error: null })
        
        toast.success("Vote Cast Successfully!", {
          description: "Your vote has been recorded on the blockchain.",
        })
        
        return true
      } catch (error: any) {
        console.error("Voting error:", error)
        const errorMessage = error?.reason || error?.message || "Failed to cast vote"
        setTxState({ isPending: false, isSuccess: false, isError: true, hash: null, error: errorMessage })
        
        toast.error("Vote Failed", {
          description: errorMessage,
        })
        
        return false
      }
    },
    [signer, isConnected, address]
  )

  const getTotalVotes = useCallback(async (electionId: number): Promise<number> => {
    if (!isContractConfigured()) {
      return 0
    }

    try {
      const contract = getContract()
      const votes = await contract.getTotalVotes(electionId)
      return Number(votes)
    } catch (error) {
      console.error("Error getting total votes:", error)
      return 0
    }
  }, [])

  const hasUserVoted = useCallback(
    async (electionId: number, userAddress: string): Promise<boolean> => {
      if (!isContractConfigured()) {
        return false
      }

      try {
        const contract = getContract()
        return await contract.hasVoted(electionId, userAddress)
      } catch (error) {
        console.error("Error checking if user voted:", error)
        return false
      }
    },
    []
  )

  const getVoters = useCallback(async (electionId: number): Promise<string[]> => {
    if (!isContractConfigured()) {
      return []
    }

    try {
      const contract = getContract()
      return await contract.getVoters(electionId)
    } catch (error) {
      console.error("Error getting voters:", error)
      return []
    }
  }, [])

  const createElection = useCallback(
    async (title: string, description: string, endTime: number) => {
      if (!isContractConfigured()) {
        toast.error("Contract Not Configured", {
          description: "Smart contract address is not configured.",
        })
        return null
      }

      if (!signer || !isConnected) {
        toast.error("Wallet Not Connected", {
          description: "Please connect your wallet to create an election.",
        })
        return null
      }

      // Validate parameters
      if (!title || title.trim().length === 0) {
        toast.error("Invalid Title", {
          description: "Election title cannot be empty.",
        })
        return null
      }

      if (!description) {
        description = "No description provided"
      }

      if (!endTime || endTime <= Math.floor(Date.now() / 1000)) {
        toast.error("Invalid End Time", {
          description: "End time must be in the future.",
        })
        return null
      }

      setTxState({ isPending: true, isSuccess: false, isError: false, hash: null, error: null })

      try {
        const contract = getContract(signer)
        
        // Ensure parameters are properly typed
        const cleanTitle = String(title).trim()
        const cleanDescription = String(description).trim()
        const cleanEndTime = Number(endTime)
        
        const tx = await contract.createElection(cleanTitle, cleanDescription, cleanEndTime)
        
        toast.success("Transaction Submitted", {
          description: "Election creation transaction submitted to blockchain.",
        })

        const receipt = await tx.wait()
        setTxState({ isPending: false, isSuccess: true, isError: false, hash: receipt.hash, error: null })
        
        toast.success("Election Created!", {
          description: "Your election has been successfully created on the blockchain.",
        })
        
        return receipt
      } catch (error: any) {
        console.error("Election creation error:", error)
        const errorMessage = error?.reason || error?.message || "Failed to create election"
        setTxState({ isPending: false, isSuccess: false, isError: true, hash: null, error: errorMessage })
        
        toast.error("Creation Failed", {
          description: errorMessage,
        })
        
        return null
      }
    },
    [signer, isConnected]
  )

  const getElection = useCallback(async (electionId: number) => {
    if (!isContractConfigured()) {
      return null
    }

    try {
      const contract = getContract()
      const [title, description, endTime, isActive, totalVotes] = await contract.getElection(electionId)
      return {
        title,
        description,
        endTime: Number(endTime),
        isActive,
        totalVotes: Number(totalVotes),
      }
    } catch (error) {
      console.error("Error getting election:", error)
      return null
    }
  }, [])

  return {
    vote,
    getTotalVotes,
    hasUserVoted,
    getVoters,
    createElection,
    getElection,
    txState,
    resetTxState,
  }
}