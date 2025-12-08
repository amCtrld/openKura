"use client"

import { Header } from "@/components/header"
import { ElectionCard } from "@/components/election-card"
import { StatsCard } from "@/components/stats-card"
import { Input } from "@/components/ui/input"
import { Vote, Users, BarChart3, Search, Boxes, Shield, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { getContract, isContractConfigured } from "@/lib/contract"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface Election {
  id: string
  electionId: number
  title: string
  description?: string
  status: "active" | "ended" | "upcoming"
  startDate?: Date
  endDate?: Date
  bannerImage?: string
  totalVotes?: number
}

const DEMO_ELECTIONS: Election[] = [
  {
    id: "1",
    electionId: 0,
    title: "Community Treasury Allocation Q4 2024",
    description: "Vote on how to allocate the community treasury funds for the upcoming quarter.",
    status: "active",
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    electionId: 1,
    title: "Protocol Upgrade Proposal #47",
    description: "Approve or reject the proposed protocol upgrade including gas optimization.",
    status: "active",
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    electionId: 2,
    title: "Governance Council Election 2024",
    description: "Elect new members to the governance council for the upcoming term.",
    status: "ended",
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    electionId: 3,
    title: "Partnership Proposal: DeFi Alliance",
    description: "Vote on establishing a strategic partnership with the DeFi Alliance.",
    status: "upcoming",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
]

export default function HomePage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [contractConfigured, setContractConfigured] = useState(false)
  const [totalVoters, setTotalVoters] = useState(0)
  const [totalVotesCast, setTotalVotesCast] = useState(0)

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setContractConfigured(isContractConfigured())
        
        if (!isContractConfigured()) {
          console.log("Contract not configured, using demo data")
          setElections(DEMO_ELECTIONS)
          setTotalVoters(41433)
          setTotalVotesCast(523806)
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
            setTotalVoters(41433)
            setTotalVotesCast(523806)
          } else {
            const electionsData = await Promise.all(
              snapshot.docs.map(async (doc) => {
                const data = doc.data()
                let totalVotes = 0
                
                // Try to get vote count from contract if electionId exists
                if (typeof data.electionId === 'number') {
                  try {
                    totalVotes = Number(await contract.getTotalVotes(data.electionId))
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
                  startDate: data.startDate?.toDate(),
                  endDate: data.endDate?.toDate(),
                  bannerImage: data.bannerImage,
                  totalVotes,
                }
              })
            )
            setElections(electionsData)
            
            // Calculate stats
            const totalVotes = electionsData.reduce((sum, election) => sum + (election.totalVotes || 0), 0)
            setTotalVotesCast(totalVotes)
            
            // Get unique voters (simplified calculation)
            setTotalVoters(Math.floor(totalVotes * 0.7))
          }
        } else {
          // Fetch all elections from blockchain
          const blockchainElections: Election[] = []
          let totalVotes = 0
          const uniqueVoters = new Set<string>()
          
          for (let i = 0; i < Number(electionCount); i++) {
            try {
              const [title, description, endTime, isActive, voteCount] = await contract.getElection(i)
              const voters = await contract.getVoters(i)
              
              voters.forEach((voter: string) => uniqueVoters.add(voter.toLowerCase()))
              totalVotes += Number(voteCount)
              
              blockchainElections.push({
                id: `blockchain-${i}`,
                electionId: i,
                title,
                description,
                status: isActive ? "active" : "ended",
                endDate: new Date(Number(endTime) * 1000),
                totalVotes: Number(voteCount),
              })
            } catch (error) {
              console.error(`Error fetching election ${i}:`, error)
            }
          }
          
          setElections(blockchainElections)
          setTotalVotesCast(totalVotes)
          setTotalVoters(uniqueVoters.size)
        }
      } catch (error) {
        console.error("Error fetching elections:", error)
        setElections(DEMO_ELECTIONS)
        setTotalVoters(41433)
        setTotalVotesCast(523806)
      } finally {
        setLoading(false)
      }
    }

    fetchElections()
  }, [])

  const filteredElections = elections.filter(
    (election) =>
      election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      election.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeCount = elections.filter((e) => e.status === "active").length

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Contract Configuration Warning */}
      {!contractConfigured && (
        <div className="container pt-6">
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Demo Mode:</strong> Smart contract not configured. Add your deployed contract address to NEXT_PUBLIC_CONTRACT_ADDRESS in .env to enable blockchain features.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero section */}
      <section className="relative overflow-hidden border-b">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative py-20 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Blockchain-Secured Voting</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Transparent Democracy
              <br />
              <span className="text-primary">On-Chain</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every vote is permanent, verifiable, and tamper-proof. Built on Ethereum for maximum transparency and trust.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatsCard icon={Boxes} label="Total Elections" value={elections.length} />
          <StatsCard icon={Vote} label="Active Elections" value={activeCount} />
          <StatsCard icon={BarChart3} label="Total Votes Cast" value={totalVotesCast} />
          <StatsCard icon={Users} label="Unique Voters" value={totalVoters} />
        </div>
      </section>

      {/* Elections list */}
      <section className="container pb-20 md:pb-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Active Elections</h2>
            <p className="text-sm text-muted-foreground mt-1">Browse and participate in ongoing votes</p>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search elections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredElections.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <Vote className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No elections found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredElections.map((election) => (
              <ElectionCard key={election.id} {...election} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <Image src="/logo.png" alt="openKura Logo" width={32} height={32} />
              <span className="font-semibold text-foreground">openKura</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Ethereum Sepolia Testnet</span>
              {!contractConfigured && (
                <span className="text-yellow-600 dark:text-yellow-400">(Demo Mode)</span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}