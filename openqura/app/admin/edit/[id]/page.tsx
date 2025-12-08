"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface ElectionData {
  title: string
  description: string
  status: "active" | "ended" | "upcoming"
  externalUrl?: string
  endDate?: Date
}

export default function EditElectionPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [election, setElection] = useState<ElectionData>({
    title: "",
    description: "",
    status: "active",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true)
        fetchElection()
      } else {
        router.push("/admin")
      }
    })

    return () => unsubscribe()
  }, [id, router])

  const fetchElection = async () => {
    try {
      const docRef = doc(db, "elections", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setElection({
          title: data.title,
          description: data.description || "",
          status: data.status || "active",
          externalUrl: data.externalUrl,
          endDate: data.endDate?.toDate(),
        })
      } else {
        toast.error("Not Found", {
          description: "Election not found.",
        })
        router.push("/admin")
      }
    } catch (error) {
      console.error("Error fetching election:", error)
      // Set demo data for preview
      setElection({
        title: "Community Treasury Allocation Q4 2024",
        description: "Vote on treasury fund allocation",
        status: "active",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, "elections", id), {
        title: election.title,
        description: election.description,
        status: election.status,
        externalUrl: election.externalUrl || null,
        endDate: election.endDate || null,
        updatedAt: new Date(),
      })

      toast.success("Saved!", {
        description: "Election has been updated successfully.",
      })

      router.push("/admin")
    } catch (error) {
      console.error("Error saving election:", error)
      toast.error("Error", {
        description: "Failed to save changes.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Edit Election</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={election.title}
                onChange={(e) => setElection({ ...election, title: e.target.value })}
                className="glass-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={election.description}
                onChange={(e) => setElection({ ...election, description: e.target.value })}
                rows={6}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={election.status}
                onValueChange={(value: "active" | "ended" | "upcoming") => setElection({ ...election, status: value })}
              >
                <SelectTrigger className="glass-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalUrl">External URL</Label>
              <Input
                id="externalUrl"
                type="url"
                placeholder="https://..."
                value={election.externalUrl || ""}
                onChange={(e) => setElection({ ...election, externalUrl: e.target.value })}
                className="glass-card"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" asChild>
                <Link href="/admin">Cancel</Link>
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 glow-primary">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
