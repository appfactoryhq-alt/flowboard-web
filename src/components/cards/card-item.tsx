"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { CalendarDays, X } from "lucide-react"
import { toast } from "sonner"

import { deleteCard, updateCardTitle, type CardActionState } from "@/lib/cards/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type Card = {
  id: string
  title: string
  due_date: string | null
  position: number
}

const initialState: CardActionState = { data: null, error: null }

export function CardItem({
  card,
  boardId,
  onDeleted,
}: {
  card: Card
  boardId: string
  onDeleted: (cardId: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const updateWithIds = updateCardTitle.bind(null, card.id, boardId)
  const [state, formAction, isPending] = useActionState(updateWithIds, initialState)
  const [prevState, setPrevState] = useState(state)
  const formRef = useRef<HTMLFormElement>(null)
  const cancelledRef = useRef(false)

  if (state !== prevState) {
    setPrevState(state)
    if (state.data) {
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteCard(card.id, boardId)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }

    toast.success("Card gelöscht.")
    onDeleted(card.id)
  }

  return (
    <div
      className={cn(
        "group/card relative rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/70 p-2.5 shadow-sm ring-1 ring-foreground/5 transition-all duration-150 ease-out hover:shadow-md hover:ring-foreground/10",
        isDeleting && "pointer-events-none opacity-50",
      )}
    >
      {isEditing ? (
        <form ref={formRef} action={formAction}>
          <Input
            name="title"
            defaultValue={card.title}
            autoFocus
            maxLength={200}
            disabled={isPending}
            className="h-7 text-sm"
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault()
                cancelledRef.current = true
                setIsEditing(false)
              }
            }}
            onBlur={() => {
              if (cancelledRef.current) {
                cancelledRef.current = false
                return
              }
              formRef.current?.requestSubmit()
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            cancelledRef.current = false
            setIsEditing(true)
          }}
          className="block w-full text-left text-sm leading-snug break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {card.title}
        </button>
      )}

      {card.due_date ? (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3" />
          {new Date(card.due_date).toLocaleDateString("de-DE", { timeZone: "UTC" })}
        </div>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Card „${card.title}“ löschen`}
        disabled={isDeleting}
        onClick={() => void handleDelete()}
        className="absolute top-1 right-1 opacity-0 transition-opacity duration-150 ease-out group-hover/card:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-3" />
      </Button>
    </div>
  )
}
