"use client"

import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Vote, BarChart3, ExternalLink, Clock, CheckCircle, Users, ArrowLeft, Loader2, Copy } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getContract } from "@/lib/contract"
import { useWallet } from "@/lib/use-wallet"
import { useVotingContract } from "@/lib/use-voting-contract"
import { toast } from "sonner"

// Demo data fallback
const DEMO_ELECTION: ElectionDetails = {
  id: "1",
  electionId: 0,
  title: "Community Treasury Allocation Q4 2024",
  description:
    "This proposal aims to allocate the community treasury funds for the upcoming quarter. The funds will be distributed among development, marketing, and community initiatives based on the voting results.\n\nKey allocations:\n- 40% Development & Infrastructure\n- 30% Marketing & Growth\n- 20% Community Rewards\n- 10% Emergency Fund",
  status: "active",
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

const DEMO_VOTERS = [
  "0x742d35Cc6634C0532925a3b844Bc9e7595f5ABEF",
  "0x8ba1f109551bD432803012645Hac136Ddc23F57A",
  "0x1234567890123456789012345678901234567890",
  "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
]


export default function VoteDetailsPage() {
  const params = useParams()
  const id = params.id as string

  const [election, setElection] = useState<ElectionDetails | null>(null)
  const [voters, setVoters] = useState<string[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const { isConnected, address, connect } = useWallet()
  const { vote, getTotalVotes, hasUserVoted, getVoters, txState } = useVotingContract()

  useEffect(() => {
    const fetchElection = async () => {
      try {
        // First, check if this is a blockchain election ID (starts with "blockchain-")
        if (id.startsWith("blockchain-")) {
          const electionId = parseInt(id.replace("blockchain-", ""))
          
          // Fetch directly from blockchain
          const contract = getContract()
          const [title, description, endTime, isActive, voteCount] = await contract.getElection(electionId)
          
          setElection({
            id,
            electionId,
            title,
            description,
            status: isActive && Date.now() < Number(endTime) * 1000 ? "active" : "ended",
            endDate: new Date(Number(endTime) * 1000),
          })

          setTotalVotes(Number(voteCount))
          const votersList = await getVoters(electionId)
          setVoters(votersList)

          if (address) {
            const voted = await hasUserVoted(electionId, address)
            setHasVoted(voted)
          }
        } else {
          // Try to fetch from Firebase
          const docRef = doc(db, "elections", id)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()
            setElection({
              id: docSnap.id,
              electionId: data.electionId,
              title: data.title,
              description: data.description,
              status: data.status || "active",
              startDate: data.startDate?.toDate(),
              endDate: data.endDate?.toDate(),
              bannerImage: data.bannerImage,
              externalUrl: data.externalUrl,
            })

            // Fetch on-chain data if electionId exists
            if (typeof data.electionId === 'number') {
              const votes = await getTotalVotes(data.electionId)
              setTotalVotes(votes)

              const votersList = await getVoters(data.electionId)
              setVoters(votersList)

              if (address) {
                const voted = await hasUserVoted(data.electionId, address)
                setHasVoted(voted)
              }
            }
          } else {
            // If not found in Firebase and not a blockchain ID, try to parse as electionId
            const electionId = parseInt(id)
            if (!isNaN(electionId)) {
              try {
                const contract = getContract()
                const [title, description, endTime, isActive, voteCount] = await contract.getElection(electionId)
                
                setElection({
                  id: `blockchain-${electionId}`,
                  electionId,
                  title,
                  description,
                  status: isActive && Date.now() < Number(endTime) * 1000 ? "active" : "ended",
                  endDate: new Date(Number(endTime) * 1000),
                })

                setTotalVotes(Number(voteCount))
                const votersList = await getVoters(electionId)
                setVoters(votersList)

                if (address) {
                  const voted = await hasUserVoted(electionId, address)
                  setHasVoted(voted)
                }
              } catch (blockchainError) {
                console.error("Error fetching from blockchain:", blockchainError)
                // Use demo data as final fallback
                setElection(DEMO_ELECTION)
                setVoters(DEMO_VOTERS)
                setTotalVotes(DEMO_VOTERS.length)
              }
            } else {
              // Use demo data as fallback
              setElection(DEMO_ELECTION)
              setVoters(DEMO_VOTERS)
              setTotalVotes(DEMO_VOTERS.length)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching election:", error)
        setElection(DEMO_ELECTION)
        setVoters(DEMO_VOTERS)
        setTotalVotes(DEMO_VOTERS.length)
      } finally {
        setLoading(false)
      }
    }

    fetchElection()
  }, [id, address, getTotalVotes, hasUserVoted, getVoters, txState.isSuccess])

  const handleVote = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (!election) return

    setIsVoting(true)
    await vote(election.electionId)
    setIsVoting(false)
  }

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    toast("Address Copied", {
      description: "Wallet address copied to clipboard.",
    })
  }

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Election Not Found</h1>
          <p className="text-muted-foreground mb-4">The election you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Back to Elections</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isActive = election.status === "active"

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        {/* Back link */}
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Elections
          </Link>
        </Button>

        {/* Election header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-primary/20 text-primary border-primary/30" : ""}
            >
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-1.5" />}
              {election.status === "active" ? "Active" : election.status === "ended" ? "Ended" : "Upcoming"}
            </Badge>
            {hasVoted && (
              <Badge variant="outline" className="text-chart-3 border-chart-3/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                You Voted
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{election.title}</h1>
          {election.endDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {isActive ? "Ends" : "Ended"} {election.endDate.toLocaleDateString()} at{" "}
                {election.endDate.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 border p-4 rounded-lg">
            <Tabs defaultValue="details" className="space-y-6">
              <TabsList className="glass-card">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="voters">Voters ({voters.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card className="glass-car">
                  <CardHeader>
                    <CardTitle>About this Election</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-muted-foreground">{election.description}</p>
                    </div>
                    {election.externalUrl && (
                      <Button variant="outline" asChild className="mt-4 gap-2 bg-transparent">
                        <a href={election.externalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Learn More
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="voters">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Voter Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {voters.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No votes cast yet. Be the first to vote!</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Wallet Address</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {voters.map((voter, index) => (
                            <TableRow key={voter}>
                              <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="font-mono">{shortenAddress(voter)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => copyAddress(voter)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" asChild>
                                    <a
                                      href={`https://sepolia.etherscan.io/address/${voter}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`View ${voter} on Etherscan`}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vote stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Vote Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-5xl font-bold text-primary font-mono">{totalVotes}</p>
                  <p className="text-muted-foreground mt-1">Total Votes</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unique Voters</span>
                    <span className="font-mono">{voters.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vote action */}
            {isActive && !hasVoted && (
              <Card className="glass-card neon-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Cast Your Vote</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your wallet and submit your vote to the blockchain.
                  </p>
                  <Button
                    onClick={handleVote}
                    disabled={isVoting || txState.isPending}
                    className="w-full gap-2 glow-primary"
                  >
                    {isVoting || txState.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : !isConnected ? (
                      <>
                        <Vote className="h-4 w-4" />
                        Connect & Vote
                      </>
                    ) : (
                      <>
                        <Vote className="h-4 w-4" />
                        Cast Vote
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasVoted && (
              <Card className="glass-card border-chart-3/30">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-chart-3 mx-auto mb-3" />
                  <h3 className="font-semibold">Vote Recorded</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your vote has been permanently recorded on the blockchain.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
