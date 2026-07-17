"use client"

import { toast } from "sonner"

import { updateCardPriority, type CardPriority } from "@/lib/cards/actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export const PRIORITY_META: Record<CardPriority, { label: string; dot: string }> = {
  low: { label: "Niedrig", dot: "bg-sky-500" },
  med: { label: "Mittel", dot: "bg-amber-500" },
  high: { label: "Hoch", dot: "bg-red-500" },
}

export function PriorityDot({ priority, className }: { priority: CardPriority; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", PRIORITY_META[priority].dot, className)}
    />
  )
}

export function PrioritySelect({
  cardId,
  boardId,
  priority,
}: {
  cardId: string
  boardId: string
  priority: CardPriority
}) {
  async function handleChange(value: string) {
    const result = await updateCardPriority(cardId, boardId, value as CardPriority)
    if (result.error) toast.error(result.error)
  }

  return (
    <Select value={priority} onValueChange={(value) => void handleChange(value as string)}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(PRIORITY_META) as CardPriority[]).map((key) => (
          <SelectItem key={key} value={key}>
            <span className="flex items-center gap-2">
              <PriorityDot priority={key} />
              {PRIORITY_META[key].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
