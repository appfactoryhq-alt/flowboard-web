import { LayoutGrid } from "lucide-react"

import { BoardCard } from "@/components/boards/board-card"
import { NewBoardDialog } from "@/components/boards/new-board-dialog"
import { createClient } from "@/lib/supabase/server"

export default async function BoardsPage() {
  const supabase = await createClient()
  const { data: boards, error } = await supabase
    .from("boards")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Boards konnten nicht geladen werden: ${error.message}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Boards</h1>
          <p className="text-sm text-muted-foreground">Deine Kanban-Boards im Überblick.</p>
        </div>
        <NewBoardDialog />
      </div>

      {boards && boards.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <LayoutGrid className="size-8 text-muted-foreground/60" />
          <p className="text-sm font-medium">Noch keine Boards</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Lege dein erstes Board an, um Lists und Cards zu organisieren.
          </p>
          <div className="mt-2">
            <NewBoardDialog />
          </div>
        </div>
      )}
    </div>
  )
}
