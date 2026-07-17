import { Target } from "lucide-react"

import { CrossBoardCardList } from "@/components/cards/cross-board-card-list"
import type { Label } from "@/lib/labels/types"
import { createClient } from "@/lib/supabase/server"

export default async function FocusPage() {
  const supabase = await createClient()

  const { data: focusCards, error: focusCardsError } = await supabase
    .from("cards")
    .select(
      "id, board_id, list_id, title, description, due_date, priority, focus_slot, position, created_at, updated_at",
    )
    .not("focus_slot", "is", null)
    .order("focus_slot", { ascending: true })

  if (focusCardsError) {
    throw new Error(`Focus-Ansicht konnte nicht geladen werden: ${focusCardsError.message}`)
  }

  const boardIds = [...new Set((focusCards ?? []).map((card) => card.board_id))]
  const cardIds = (focusCards ?? []).map((card) => card.id)

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

  const cards = (focusCards ?? []).map((card) => ({
    ...card,
    labelIds: labelIdsByCard[card.id] ?? [],
  }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <Target className="size-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Focus</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Bis zu 3 Cards, auf die du dich gerade konzentrierst ({cards.length}/3 belegt).
      </p>

      {cards.length > 0 ? (
        <div className="mt-6">
          <CrossBoardCardList cards={cards} boardNameById={boardNameById} labelsByBoard={labelsByBoard} />
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Target className="size-8 text-muted-foreground/60" />
          <p className="text-sm font-medium">Noch keine Focus-Cards</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Markiere bis zu drei Cards über das Zielscheiben-Icon, um sie hier zu sammeln.
          </p>
        </div>
      )}
    </div>
  )
}
