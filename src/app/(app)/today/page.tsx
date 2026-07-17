import { Sparkles } from "lucide-react"

import { TodayCardsList } from "@/components/today/today-cards-list"
import type { Label } from "@/lib/labels/types"
import { createClient } from "@/lib/supabase/server"

export default async function TodayPage() {
  const supabase = await createClient()

  const { data: todayCards, error: todayCardsError } = await supabase
    .from("today_cards")
    .select("id, board_id, list_id, title, description, due_date, priority, position, created_at, updated_at")
    .order("position", { ascending: true })

  if (todayCardsError) {
    throw new Error(`Heute-Ansicht konnte nicht geladen werden: ${todayCardsError.message}`)
  }

  const boardIds = [...new Set((todayCards ?? []).map((card) => card.board_id))]
  const cardIds = (todayCards ?? []).map((card) => card.id)

  const [{ data: boards, error: boardsError }, { data: labels, error: labelsError }, { data: cardLabels, error: cardLabelsError }] =
    await Promise.all([
      boardIds.length > 0
        ? supabase.from("boards").select("id, name").in("id", boardIds)
        : Promise.resolve({ data: [], error: null }),
      boardIds.length > 0
        ? supabase.from("labels").select("id, name, color, board_id").in("board_id", boardIds)
        : Promise.resolve({ data: [], error: null }),
      cardIds.length > 0
        ? supabase.from("card_labels").select("card_id, label_id").in("card_id", cardIds)
        : Promise.resolve({ data: [], error: null }),
    ])

  if (boardsError) throw new Error(`Boards konnten nicht geladen werden: ${boardsError.message}`)
  if (labelsError) throw new Error(`Labels konnten nicht geladen werden: ${labelsError.message}`)
  if (cardLabelsError) {
    throw new Error(`Label-Zuordnungen konnten nicht geladen werden: ${cardLabelsError.message}`)
  }

  const boardNameById: Record<string, string> = {}
  for (const board of boards ?? []) {
    boardNameById[board.id] = board.name
  }

  const labelsByBoard: Record<string, Label[]> = {}
  for (const label of labels ?? []) {
    ;(labelsByBoard[label.board_id] ??= []).push(label)
  }

  const labelIdsByCard: Record<string, string[]> = {}
  for (const entry of cardLabels ?? []) {
    ;(labelIdsByCard[entry.card_id] ??= []).push(entry.label_id)
  }

  const cards = (todayCards ?? []).map((card) => ({
    ...card,
    labelIds: labelIdsByCard[card.id] ?? [],
  }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Heute</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Cards mit Fälligkeitsdatum heute, über alle Boards hinweg.
      </p>

      {cards.length > 0 ? (
        <div className="mt-6">
          <TodayCardsList cards={cards} boardNameById={boardNameById} labelsByBoard={labelsByBoard} />
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Sparkles className="size-8 text-muted-foreground/60" />
          <p className="text-sm font-medium">Keine Cards heute fällig</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cards mit einem Fälligkeitsdatum von heute erscheinen automatisch hier.
          </p>
        </div>
      )}
    </div>
  )
}
