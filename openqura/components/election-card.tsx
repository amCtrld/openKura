"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Vote, BarChart3, Clock, CheckCircle, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/lib/use-wallet"
import { useVotingContract } from "@/lib/use-voting-contract"
import { useState, useEffect } from "react"

interface ElectionCardProps {
  id: string
  electionId: number
  title: string
  description?: string
  status: "active" | "ended" | "upcoming"
  endDate?: Date
  startDate?: Date
}

export function ElectionCard({ id, electionId, title, description, status, endDate }: ElectionCardProps) {
  const { isConnected, address, connect } = useWallet()
  const { vote, getTotalVotes, hasUserVoted, txState } = useVotingContract()
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [hasVoted, setHasVoted] = useState<boolean>(false)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const votes = await getTotalVotes(electionId)
      setTotalVotes(votes)

      if (address) {
        const voted = await hasUserVoted(electionId, address)
        setHasVoted(voted)
      }
    }
    fetchData()
  }, [electionId, address, getTotalVotes, hasUserVoted, txState.isSuccess])

  const handleVote = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    setIsVoting(true)
    await vote(electionId)
    setIsVoting(false)
  }

  const isActive = status === "active"
  const isEnded = status === "ended"

  return (
    <Card className="glass-card group hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={isActive ? "default" : isEnded ? "secondary" : "outline"}
                className={isActive ? "bg-primary/20 text-primary border-primary/30" : ""}
              >
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-1.5" />}
                {status === "active" ? "Active" : status === "ended" ? "Ended" : "Upcoming"}
              </Badge>
              {hasVoted && (
                <Badge variant="outline" className="text-chart-3 border-chart-3/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Voted
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
            {description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}
            {endDate && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Ends {endDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary font-mono">{totalVotes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">total votes</p>
            </div>

            <div className="flex items-center gap-2">
              {isActive && !hasVoted && (
                <Button
                  onClick={handleVote}
                  disabled={isVoting || txState.isPending}
                  size="sm"
                  className="gap-1.5 glow-primary"
                >
                  {isVoting || txState.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Voting...
                    </>
                  ) : (
                    <>
                      <Vote className="h-3.5 w-3.5" />
                      Vote
                    </>
                  )}
                </Button>
              )}
              {isEnded && (
                <Button size="sm" variant="outline" disabled className="gap-1.5 bg-transparent">
                  <Lock className="h-3.5 w-3.5" />
                  Ended
                </Button>
              )}
              <Button variant="outline" size="sm" asChild className="gap-1.5 bg-transparent">
                <Link href={`/vote/${id}`}>
                  <BarChart3 className="h-3.5 w-3.5" />
                  Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
