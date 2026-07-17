"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { createCard, type CardActionState } from "@/lib/cards/actions"
import { Input } from "@/components/ui/input"

const initialState: CardActionState = { data: null, error: null }

export function QuickAddCard({ listId, boardId }: { listId: string; boardId: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const createWithIds = createCard.bind(null, listId, boardId)
  const [state, formAction, isPending] = useActionState(createWithIds, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
      return
    }
    if (state.data) {
      formRef.current?.reset()
    }
  }, [state])

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          cancelledRef.current = false
          setIsEditing(true)
        }}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Plus className="size-3.5" />
        Card hinzufügen
      </button>
    )
  }

  return (
    <form ref={formRef} action={formAction}>
      <Input
        name="title"
        autoFocus
        maxLength={200}
        disabled={isPending}
        placeholder="Titel der Card"
        className="h-8 text-sm"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            cancelledRef.current = true
            setIsEditing(false)
          }
        }}
        onBlur={(event) => {
          if (cancelledRef.current) {
            cancelledRef.current = false
            return
          }
          if (!event.currentTarget.value.trim()) {
            setIsEditing(false)
            return
          }
          formRef.current?.requestSubmit()
        }}
      />
    </form>
  )
}
