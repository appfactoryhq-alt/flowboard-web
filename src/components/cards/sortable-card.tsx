"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { CardItem, type Card } from "@/components/cards/card-item"
import { cn } from "@/lib/utils"

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("touch-none", isDragging && "opacity-40")}
    >
      <CardItem card={card} boardId={boardId} onDeleted={onDeleted} />
    </div>
  )
}
