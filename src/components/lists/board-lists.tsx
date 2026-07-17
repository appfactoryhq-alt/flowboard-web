"use client"

import { useState } from "react"
import { Reorder } from "motion/react"
import { toast } from "sonner"

import { reorderList } from "@/lib/lists/actions"
import { ListColumn } from "@/components/lists/list-column"
import { NewListButton } from "@/components/lists/new-list-button"
import type { Card } from "@/components/cards/card-item"

type List = { id: string; name: string; position: number }

const POSITION_STEP = 1000

export function BoardLists({
  boardId,
  initialLists,
  cardsByList,
}: {
  boardId: string
  initialLists: List[]
  cardsByList: Record<string, Card[]>
}) {
  const [lists, setLists] = useState(initialLists)
  const [prevInitialLists, setPrevInitialLists] = useState(initialLists)

  if (initialLists !== prevInitialLists) {
    setPrevInitialLists(initialLists)
    setLists(initialLists)
  }

  async function handleDragEnd(listId: string) {
    const index = lists.findIndex((list) => list.id === listId)
    if (index === -1) return

    const prev = lists[index - 1]
    const next = lists[index + 1]

    let newPosition: number
    if (!prev && !next) newPosition = POSITION_STEP
    else if (!prev) newPosition = next.position - POSITION_STEP
    else if (!next) newPosition = prev.position + POSITION_STEP
    else newPosition = (prev.position + next.position) / 2

    // Fractional Ranking hat bei float8 nur begrenzte Praezision: nach wiederholtem
    // Einsortieren zwischen denselben Nachbarn kann der Mittelwert exakt auf einen
    // Nachbarwert runden. In diesem Fall alle sichtbaren Positionen auf sichere
    // 1000er-Abstaende rebalancieren, statt eine kollidierende Position zu persistieren.
    const collides =
      (prev && newPosition === prev.position) || (next && newPosition === next.position)

    if (collides) {
      const rebalanced = lists.map((list, i) => ({ ...list, position: (i + 1) * POSITION_STEP }))
      setLists(rebalanced)

      const results = await Promise.all(
        rebalanced.map((list) => reorderList(list.id, boardId, list.position)),
      )
      const failed = results.find((result) => result.error)
      if (failed?.error) {
        toast.error(failed.error)
        setLists(initialLists)
      }
      return
    }

    setLists((current) =>
      current.map((list) => (list.id === listId ? { ...list, position: newPosition } : list)),
    )

    const result = await reorderList(listId, boardId, newPosition)
    if (result.error) {
      toast.error(result.error)
      setLists(initialLists)
    }
  }

  return (
    <div className="flex h-full items-start gap-4 overflow-x-auto px-4 pb-4 sm:px-6">
      <Reorder.Group
        as="div"
        axis="x"
        values={lists}
        onReorder={setLists}
        className="flex items-start gap-4"
      >
        {lists.map((list) => (
          <Reorder.Item
            as="div"
            key={list.id}
            value={list}
            onDragEnd={() => handleDragEnd(list.id)}
          >
            <ListColumn
              list={list}
              boardId={boardId}
              initialCards={cardsByList[list.id] ?? []}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <NewListButton boardId={boardId} isFirst={lists.length === 0} />
    </div>
  )
}
