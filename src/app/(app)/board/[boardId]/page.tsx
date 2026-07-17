import { notFound } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  const supabase = await createClient()
  const { data: board, error } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", boardId)
    .maybeSingle()

  if (error) {
    throw new Error(`Board konnte nicht geladen werden: ${error.message}`)
  }

  if (!board) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">{board.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Lists und Cards folgen in Spec 05.</p>
    </div>
  )
}
