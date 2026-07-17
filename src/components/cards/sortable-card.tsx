"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { CardItem, type Card } from "@/components/cards/card-item"

export function SortableCard({
  card,
  boardId,
  onDeleted,
}: {
  card: Card
  boardId: string
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
      onDeleted={onDeleted}
      dragRef={setNodeRef}
      dragStyle={{ transform: CSS.Transform.toString(transform), transition }}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
    />
  )
}
