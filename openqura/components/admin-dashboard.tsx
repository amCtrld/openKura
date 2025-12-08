"use client"

import { useState, useEffect } from "react"
import { type User, signOut } from "firebase/auth"
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { getContract, isContractConfigured } from "@/lib/contract"
import { useVotingContract } from "@/lib/use-voting-contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Vote, Plus, LogOut, MoreHorizontal, Edit, Archive, Trash2, BarChart3, Users, Boxes } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { WalletConnect } from "@/components/wallet-connect"
import { CreateElectionDialog } from "./create-election-dialog"
import { StatsCard } from "@/components/stats-card"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Election {
  id: string
  electionId: number
  title: string
  description: string
  status: "active" | "ended" | "upcoming"
  createdAt: Date
  endDate?: Date
  totalVotes?: number
  voters?: string[]
}

// Demo elections for when Firebase isn't configured
const DEMO_ELECTIONS: Election[] = [
  {
    id: "1",
    electionId: 0,
    title: "Community Treasury Allocation Q4 2024",
    description: "Vote on treasury fund allocation",
    status: "active",
    createdAt: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    electionId: 1,
    title: "Protocol Upgrade Proposal #47",
    description: "Approve protocol upgrade",
    status: "active",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
]

export function AdminDashboard({ user }: { user: User }) {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [contractConfigured, setContractConfigured] = useState(false)
  const [totalVotes, setTotalVotes] = useState(0)
  const [uniqueVoters, setUniqueVoters] = useState(0)
  const { getTotalVotes, getVoters } = useVotingContract()

  const fetchElections = async () => {
    try {
      setContractConfigured(isContractConfigured())
      
      if (!isContractConfigured()) {
        console.log("Contract not configured, using demo data")
        setElections(DEMO_ELECTIONS)
        setTotalVotes(523806)
        setUniqueVoters(41433)
        setLoading(false)
        return
      }

      // Try to fetch from blockchain first
      const contract = getContract()
      const electionCount = await contract.getElectionCount()
      
      if (electionCount === 0n) {
        // No elections on blockchain, check Firebase
        const electionsRef = collection(db, "elections")
        const q = query(electionsRef, orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setElections(DEMO_ELECTIONS)
          setTotalVotes(523806)
          setUniqueVoters(41433)
        } else {
          const electionsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data()
              let totalVotesForElection = 0
              let voters: string[] = []
              
              // Try to get vote count from contract if electionId exists
              if (typeof data.electionId === 'number') {
                try {
                  totalVotesForElection = await getTotalVotes(data.electionId)
                  voters = await getVoters(data.electionId)
                } catch (error) {
                  console.log(`Could not fetch votes for election ${data.electionId}:`, error)
                }
              }
              
              return {
                id: doc.id,
                electionId: data.electionId,
                title: data.title,
                description: data.description,
                status: data.status || "active",
                createdAt: data.createdAt?.toDate() || new Date(),
                endDate: data.endDate?.toDate(),
                totalVotes: totalVotesForElection,
                voters,
              }
            })
          )
          setElections(electionsData)
          
          // Calculate stats
          const totalVotesCount = electionsData.reduce((sum, election) => sum + (election.totalVotes || 0), 0)
          setTotalVotes(totalVotesCount)
          
          // Get unique voters
          const allVoters = new Set<string>()
          electionsData.forEach(election => {
            election.voters?.forEach(voter => allVoters.add(voter.toLowerCase()))
          })
          setUniqueVoters(allVoters.size)
        }
      } else {
        // Fetch all elections from blockchain
        const blockchainElections: Election[] = []
        let totalVotesCount = 0
        const allVoters = new Set<string>()
        
        for (let i = 0; i < Number(electionCount); i++) {
          try {
            const [title, description, endTime, isActive, voteCount] = await contract.getElection(i)
            const voters = await getVoters(i)
            
            voters.forEach((voter: string) => allVoters.add(voter.toLowerCase()))
            totalVotesCount += Number(voteCount)
            
            blockchainElections.push({
              id: `blockchain-${i}`,
              electionId: i,
              title,
              description,
              status: isActive ? "active" : "ended",
              createdAt: new Date(), // We don't have creation time from contract
              endDate: new Date(Number(endTime) * 1000),
              totalVotes: Number(voteCount),
              voters,
            })
          } catch (error) {
            console.error(`Error fetching election ${i}:`, error)
          }
        }
        
        setElections(blockchainElections)
        setTotalVotes(totalVotesCount)
        setUniqueVoters(allVoters.size)
      }
    } catch (error) {
      console.error("Error fetching elections:", error)
      setElections(DEMO_ELECTIONS)
      setTotalVotes(523806)
      setUniqueVoters(41433)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElections()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast.success("Signed Out", {
        description: "You have been signed out successfully.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleArchive = async (electionId: string) => {
    try {
      await updateDoc(doc(db, "elections", electionId), {
        status: "ended",
      })
      toast.success("Election Archived", {
        description: "The election has been marked as ended.",
      })
      fetchElections()
    } catch (error) {
      console.error("Error archiving election:", error)
      toast.error("Error", {
        description: "Failed to archive election.",
      })
    }
  }

  const handleDelete = async (electionId: string) => {
    try {
      await deleteDoc(doc(db, "elections", electionId))
      toast.success("Election Deleted", {
        description: "The election has been permanently deleted.",
      })
      fetchElections()
    } catch (error) {
      console.error("Error deleting election:", error)
      toast.error("Error", {
        description: "Failed to delete election.",
      })
    }
  }

  const activeCount = elections.filter((e) => e.status === "active").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-1 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
              <Image src="/logo.png" alt="openKura Logo" width={32} height={32} className="relative" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">openKura</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                Admin
              </Badge>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <WalletConnect />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 glass-card bg-transparent">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{user.email?.[0].toUpperCase()}</span>
                  </div>
                  <span className="hidden md:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your elections and view analytics</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2 glow-primary">
            <Plus className="h-4 w-4" />
            Create Election
          </Button>
        </div>

        {/* Contract Configuration Warning */}
        {!contractConfigured && (
          <div className="mb-6">
            <div className="border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 text-yellow-600 dark:text-yellow-400">⚠️</div>
                <div className="text-yellow-800 dark:text-yellow-200">
                  <strong>Demo Mode:</strong> Smart contract not configured. Real blockchain features are disabled.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={Boxes} label="Total Elections" value={elections.length} />
          <StatsCard icon={Vote} label="Active Elections" value={activeCount} />
          <StatsCard icon={BarChart3} label="Total Votes" value={totalVotes} />
          <StatsCard icon={Users} label="Unique Voters" value={uniqueVoters} />
        </div>

        {/* Elections table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Elections</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : elections.length === 0 ? (
              <div className="text-center py-12">
                <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No elections yet</p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Election
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elections.map((election) => (
                    <TableRow key={election.id}>
                      <TableCell className="font-medium">{election.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={election.status === "active" ? "default" : "secondary"}
                          className={election.status === "active" ? "bg-primary/20 text-primary border-primary/30" : ""}
                        >
                          {election.status === "active" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
                          )}
                          {election.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{election.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {election.endDate?.toLocaleDateString() || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card">
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/vote/${election.id}`}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/admin/edit/${election.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleArchive(election.id)} className="cursor-pointer">
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(election.id)}
                              className="text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateElectionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={fetchElections} />
    </div>
  )
}
