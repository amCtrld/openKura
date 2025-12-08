"use client"

import type React from "react"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Vote, Loader2, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"

export function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success("Welcome back!", {
        description: "You have successfully logged in.",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials"
      toast.error("Login Failed", {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md glass-card relative">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>Sign in to manage elections on openKura</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-card"
              />
            </div>
            <Button type="submit" className="w-full glow-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="ghost" asChild>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                <Image src="/logo.png" alt="openKura Logo" width={16} height={16} className="inline-block" />
                Back to Elections
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
