import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtext?: string
}

export function StatsCard({ icon: Icon, label, value, subtext }: StatsCardProps) {
  return (
    <Card className="glass-card group hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full group-hover:bg-primary/20 transition-colors" />
            <div className="relative p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground font-mono">{value.toLocaleString()}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
