"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import {
  applyCategorySuggestion,
  suggestCategory,
  type CategorySuggestion,
} from "@/lib/ai/actions"
import { PRIORITY_META, PriorityDot } from "@/components/cards/priority-select"
import { Button } from "@/components/ui/button"

export function CategorySuggestionPanel({
  cardId,
  boardId,
  cardUpdatedAt,
}: {
  cardId: string
  boardId: string
  cardUpdatedAt: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null)
  // Snapshot des Zeitpunkts, an dem der Vorschlag generiert wurde - nicht der
  // aktuelle card.updated_at-Prop, damit der Versions-Check in
  // applyCategorySuggestion tatsaechlich "hat sich die Card seit dem
  // Vorschlag geaendert" prueft, nicht "seit dem letzten Rendern".
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState<string | null>(null)

  async function handleSuggest() {
    setIsLoading(true)
    setSuggestion(null)
    const result = await suggestCategory(cardId)
    setIsLoading(false)

    if (result.error || !result.data) {
      toast.error(result.error ?? "Vorschlag konnte nicht generiert werden.")
      return
    }

    setSuggestion(result.data)
    setSnapshotUpdatedAt(cardUpdatedAt)
  }

  async function handleApply() {
    if (!suggestion || !snapshotUpdatedAt) return

    setIsApplying(true)
    const result = await applyCategorySuggestion(
      cardId,
      boardId,
      snapshotUpdatedAt,
      suggestion.priority,
      suggestion.labelIds,
    )
    setIsApplying(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Vorschlag übernommen.")
    setSuggestion(null)
    setSnapshotUpdatedAt(null)
  }

  function handleDismiss() {
    setSuggestion(null)
    setSnapshotUpdatedAt(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={() => void handleSuggest()}
        className="w-fit gap-1.5"
      >
        <Sparkles className="size-3.5" />
        {isLoading ? "Analysiere…" : "Vorschlag holen"}
      </Button>

      {suggestion ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
          <div className="flex items-center gap-1.5 text-sm">
            <PriorityDot priority={suggestion.priority} />
            Priorität: {PRIORITY_META[suggestion.priority].label}
          </div>
          {suggestion.labelNames.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Labels: {suggestion.labelNames.join(", ")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Keine passenden Labels gefunden.</p>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={isApplying} onClick={() => void handleApply()}>
              {isApplying ? "Wird übernommen…" : "Übernehmen"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isApplying}
              onClick={handleDismiss}
            >
              Verwerfen
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
