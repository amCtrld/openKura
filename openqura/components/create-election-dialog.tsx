"use client"

import type React from "react"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Vote, Wallet } from "lucide-react"
import { useWallet } from "@/lib/use-wallet"
import { useVotingContract } from "@/lib/use-voting-contract"
import { toast } from "sonner"

interface CreateElectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateElectionDialog({ open, onOpenChange, onSuccess }: CreateElectionDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)

  const { isConnected, connect } = useWallet()
  const { createElection, txState } = useVotingContract()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      await connect()
      return
    }

    setLoading(true)

    try {
      // First, create the election on-chain
      toast.info("Creating Election", {
        description: "Please confirm the transaction in your wallet...",
      })

      // Convert end date to Unix timestamp
      const endTime = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000) // Default to 30 days from now

      const receipt = await createElection(title, description || "No description provided", endTime)

      if (!receipt) {
        setLoading(false)
        return
      }

      // Then store metadata in Firestore
      // Extract electionId from event logs (simplified - in production parse the event)
      const electionId = Date.now() // Placeholder - would parse from contract event

      await addDoc(collection(db, "elections"), {
        title,
        description,
        externalUrl: externalUrl || null,
        endDate: endDate ? new Date(endDate) : null,
        status: "active",
        electionId,
        transactionHash: receipt.hash,
        createdAt: serverTimestamp(),
      })

      toast.success("Election Created!", {
        description: "Your election is now live and ready for voting.",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setExternalUrl("")
      setEndDate("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating election:", error)
      toast.error("Error", {
        description: "Failed to create election. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            Create New Election
          </DialogTitle>
          <DialogDescription>
            Create a new election on the blockchain. This requires a wallet transaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Election Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Community Treasury Allocation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="glass-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what voters are deciding on..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="glass-card resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalUrl">External URL (optional)</Label>
            <Input
              id="externalUrl"
              type="url"
              placeholder="https://..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="glass-card"
            />
          </div>

          {!isConnected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              <span>Connect your wallet to create an election</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || txState.isPending || !title} className="glow-primary">
              {loading || txState.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : !isConnected ? (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              ) : (
                "Create Election"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
