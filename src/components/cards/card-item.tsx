"use client"

import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react"
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"
import { motion } from "motion/react"
import { CalendarDays, X } from "lucide-react"
import { toast } from "sonner"

import { deleteCard, updateCardTitle, type CardActionState, type CardPriority } from "@/lib/cards/actions"
import { CardDetailDialog } from "@/components/cards/card-detail-dialog"
import { LabelBadge } from "@/components/labels/label-badge"
import { PriorityDot } from "@/components/cards/priority-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Label } from "@/lib/labels/types"

export type Card = {
  id: string
  board_id: string
  list_id: string
  title: string
  description: string | null
  due_date: string | null
  priority: CardPriority
  labelIds: string[]
  position: number
  created_at: string
  updated_at: string
}

const initialState: CardActionState = { data: null, error: null }

export function CardItem({
  card,
  boardId,
  boardLabels,
  onDeleted,
  dragRef,
  dragStyle,
  dragAttributes,
  dragListeners,
  isDragging,
}: {
  card: Card
  boardId: string
  boardLabels: Label[]
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
          "group/card relative cursor-pointer rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/70 p-2.5 shadow-sm ring-1 ring-foreground/5 transition-all duration-150 ease-out hover:shadow-md hover:ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          // touch-none nur innerhalb eines dnd-kit-Kontexts (Board-Ansicht) -
          // in reinen Lese-Listen wie /today wuerde es vertikales Touch-Scrollen
          // blockieren, ohne dass hier tatsaechlich gedraggt werden kann.
          dragListeners && "touch-none",
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

        {card.labelIds.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {card.labelIds.flatMap((labelId) => {
              const label = boardLabels.find((candidate) => candidate.id === labelId)
              return label ? [<LabelBadge key={label.id} label={label} />] : []
            })}
          </div>
        ) : null}

        {card.due_date || card.priority !== "med" ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {card.due_date ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {new Date(card.due_date).toLocaleDateString("de-DE", { timeZone: "UTC" })}
              </span>
            ) : null}
            {card.priority !== "med" ? (
              <span className="flex items-center gap-1">
                <PriorityDot priority={card.priority} />
                <span className="sr-only">
                  Priorität {card.priority === "high" ? "hoch" : "niedrig"}
                </span>
              </span>
            ) : null}
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
        boardLabels={boardLabels}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
      />
    </>
  )
}
