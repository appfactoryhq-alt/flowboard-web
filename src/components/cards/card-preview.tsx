import { CalendarDays } from "lucide-react"

import type { Card } from "@/components/cards/card-item"

export function CardPreview({ card }: { card: Card }) {
  return (
    <div className="w-72 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/70 p-2.5 shadow-lg ring-1 ring-foreground/10">
      <p className="text-sm leading-snug break-words">{card.title}</p>
      {card.due_date ? (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3" />
          {new Date(card.due_date).toLocaleDateString("de-DE", { timeZone: "UTC" })}
        </div>
      ) : null}
    </div>
  )
}
