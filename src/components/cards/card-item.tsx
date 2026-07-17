"use client"

import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react"
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"
import { motion } from "motion/react"
import { CalendarDays, X } from "lucide-react"
import { toast } from "sonner"

import { deleteCard, updateCardTitle, type CardActionState } from "@/lib/cards/actions"
import { CardDetailDialog } from "@/components/cards/card-detail-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type Card = {
  id: string
  list_id: string
  title: string
  description: string | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

const initialState: CardActionState = { data: null, error: null }

export function CardItem({
  card,
  boardId,
  onDeleted,
  dragRef,
  dragStyle,
  dragAttributes,
  dragListeners,
  isDragging,
}: {
  card: Card
  boardId: string
  onDeleted: (cardId: string) => void
  dragRef?: (node: HTMLElement | null) => void
  dragStyle?: CSSProperties
  dragAttributes?: DraggableAttributes
  dragListeners?: DraggableSyntheticListeners
  isDragging?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const updateWithIds = updateCardTitle.bind(null, card.id, boardId)
  const [state, formAction, isPending] = useActionState(updateWithIds, initialState)
  const [prevState, setPrevState] = useState(state)
  const formRef = useRef<HTMLFormElement>(null)
  const cancelledRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  function openDetail() {
    if (!isEditing) setDetailOpen(true)
  }

  function handleDetailOpenChange(next: boolean) {
    setDetailOpen(next)
    if (!next) {
      containerRef.current?.focus()
    }
  }

  return (
    <>
      <div
        ref={(node) => {
          containerRef.current = node
          dragRef?.(node)
        }}
        style={dragStyle}
        {...dragAttributes}
        {...dragListeners}
        onClick={openDetail}
        onKeyDown={(event) => {
          // Nur reagieren, wenn das Event direkt auf diesem Container ausgeloest
          // wurde, nicht wenn es von einem verschachtelten interaktiven Element
          // (Titel-Button, Delete-Button) hochblubbert - sonst wuerde Enter/Space
          // auf diesen Elementen zusaetzlich das Modal oeffnen.
          if (event.target !== event.currentTarget) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openDetail()
          }
        }}
        className={cn(
          "group/card relative cursor-pointer touch-none rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/70 p-2.5 shadow-sm ring-1 ring-foreground/5 transition-all duration-150 ease-out hover:shadow-md hover:ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isDragging && "opacity-40",
          isDeleting && "pointer-events-none opacity-50",
        )}
      >
        <motion.div layoutId={`card-${card.id}`}>
          {isEditing ? (
            <form
              ref={formRef}
              action={formAction}
              onClick={(event) => event.stopPropagation()}
            >
              <Input
                name="title"
                defaultValue={card.title}
                autoFocus
                maxLength={200}
                disabled={isPending}
                className="h-7 text-sm"
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={(event) => {
                  event.stopPropagation()
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
              onClick={(event) => {
                event.stopPropagation()
                cancelledRef.current = false
                setIsEditing(true)
              }}
              className="block w-full text-left text-sm leading-snug break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {card.title}
            </button>
          )}
        </motion.div>

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
          onClick={(event) => {
            event.stopPropagation()
            void handleDelete()
          }}
          onKeyDown={(event) => event.stopPropagation()}
          className="absolute top-1 right-1 opacity-0 transition-opacity duration-150 ease-out group-hover/card:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3" />
        </Button>
      </div>

      <CardDetailDialog
        card={card}
        boardId={boardId}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
      />
    </>
  )
}
