"use client"

import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"
import { motion } from "motion/react"
import { CalendarDays, Target, X } from "lucide-react"
import { toast } from "sonner"

import {
  activateFocus,
  deactivateFocus,
  deleteCard,
  updateCardTitle,
  type CardActionState,
  type CardPriority,
} from "@/lib/cards/actions"
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
  focus_slot: number | null
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const shouldOpenFromSearch = searchParams.get("card") === card.id

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingFocus, setIsTogglingFocus] = useState(false)
  const [detailOpen, setDetailOpen] = useState(shouldOpenFromSearch)
  const [handledSearchOpen, setHandledSearchOpen] = useState(shouldOpenFromSearch)

  // Deep-Link aus der Suche (?card=<id>): Dialog oeffnen, sobald der Param auf
  // diese Card zeigt - auch wenn die Card bereits gemountet ist (Suchtreffer
  // auf dem gerade angezeigten Board aendert nur den Query-Param, kein neuer
  // Mount, ein reiner useState-Initializer wuerde das verpassen). Ueber den
  // "adjust state during render"-Guard statt eines setState-Aufrufs im
  // Effekt-Body (eslint react-hooks/set-state-in-effect).
  if (shouldOpenFromSearch && !handledSearchOpen) {
    setHandledSearchOpen(true)
    setDetailOpen(true)
  } else if (!shouldOpenFromSearch && handledSearchOpen) {
    setHandledSearchOpen(false)
  }

  // Den Query-Param nach dem Oeffnen wieder entfernen, damit ein Reload/
  // Zurueck-Navigieren ihn nicht erneut triggert - das ist ein echter
  // Seiteneffekt (Router-Aufruf) und bleibt daher im Effekt.
  useEffect(() => {
    if (!shouldOpenFromSearch) return
    const params = new URLSearchParams(searchParams)
    params.delete("card")
    router.replace(params.size > 0 ? `${pathname}?${params}` : pathname, { scroll: false })
  }, [shouldOpenFromSearch, pathname, router, searchParams])
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

  async function handleToggleFocus() {
    setIsTogglingFocus(true)
    const result =
      card.focus_slot !== null
        ? await deactivateFocus(card.id, boardId)
        : await activateFocus(card.id, boardId)
    setIsTogglingFocus(false)

    if (result.error) {
      toast.error(result.error)
    }
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
          aria-label={
            card.focus_slot !== null
              ? `Card „${card.title}“ aus Focus entfernen`
              : `Card „${card.title}“ zu Focus hinzufügen`
          }
          aria-pressed={card.focus_slot !== null}
          disabled={isTogglingFocus}
          onClick={(event) => {
            event.stopPropagation()
            void handleToggleFocus()
          }}
          onKeyDown={(event) => event.stopPropagation()}
          className={cn(
            "absolute top-1 right-8 transition-opacity duration-150 ease-out focus-visible:opacity-100 group-hover/card:opacity-100",
            card.focus_slot !== null ? "text-primary opacity-100" : "opacity-0",
          )}
        >
          <Target className={cn("size-3", card.focus_slot !== null && "fill-current")} />
        </Button>

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
