"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { CardItem, type Card } from "@/components/cards/card-item"
import type { Label } from "@/lib/labels/types"

export function SortableCard({
  card,
  boardId,
  boardLabels,
  onDeleted,
}: {
  card: Card
  boardId: string
  boardLabels: Label[]
  onDeleted: (cardId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.list_id },
  })

  return (
    <CardItem
      card={card}
      boardId={boardId}
      boardLabels={boardLabels}
      onDeleted={onDeleted}
      dragRef={setNodeRef}
      dragStyle={{ transform: CSS.Transform.toString(transform), transition }}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
    />
  )
}
