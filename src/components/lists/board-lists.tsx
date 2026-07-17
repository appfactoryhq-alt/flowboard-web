"use client"

import { useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Reorder } from "motion/react"
import { toast } from "sonner"

import { reorderList } from "@/lib/lists/actions"
import { moveCard } from "@/lib/cards/actions"
import { ListColumn } from "@/components/lists/list-column"
import { NewListButton } from "@/components/lists/new-list-button"
import { CardPreview } from "@/components/cards/card-preview"
import type { Card } from "@/components/cards/card-item"
import type { Label } from "@/lib/labels/types"
import { useRealtimeCards, type CardsTableRow } from "@/hooks/use-realtime-cards"

type List = { id: string; name: string; position: number }

const POSITION_STEP = 1000

export function BoardLists({
  boardId,
  initialLists,
  cardsByList: initialCardsByList,
  boardLabels,
}: {
  boardId: string
  initialLists: List[]
  cardsByList: Record<string, Card[]>
  boardLabels: Label[]
}) {
  const [lists, setLists] = useState(initialLists)
  const [prevInitialLists, setPrevInitialLists] = useState(initialLists)
  const [cardsByList, setCardsByList] = useState(initialCardsByList)
  const [prevInitialCardsByList, setPrevInitialCardsByList] = useState(initialCardsByList)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const dragStartSnapshotRef = useRef<Record<string, Card[]> | null>(null)
  const dragGenerationRef = useRef(0)

  if (initialLists !== prevInitialLists) {
    setPrevInitialLists(initialLists)
    setLists(initialLists)
  }

  if (initialCardsByList !== prevInitialCardsByList) {
    setPrevInitialCardsByList(initialCardsByList)
    setCardsByList(initialCardsByList)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  function findListId(cardId: string): string | undefined {
    return Object.keys(cardsByList).find((listId) =>
      cardsByList[listId]?.some((card) => card.id === cardId),
    )
  }

  function handleCardDragStart(event: DragStartEvent) {
    dragGenerationRef.current += 1
    dragStartSnapshotRef.current = cardsByList

    const cardId = String(event.active.id)
    const listId = findListId(cardId)
    if (!listId) return
    setActiveCard(cardsByList[listId]?.find((card) => card.id === cardId) ?? null)
  }

  function handleCardDragCancel() {
    setActiveCard(null)
    if (dragStartSnapshotRef.current) {
      setCardsByList(dragStartSnapshotRef.current)
    }
    dragStartSnapshotRef.current = null
  }

  function handleCardDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const sourceListId = findListId(activeId)
    if (!sourceListId) return

    const targetListId = findListId(overId) ?? overId
    if (!(targetListId in cardsByList)) return

    setCardsByList((current) => {
      const sourceCards = current[sourceListId] ?? []
      const cardIndex = sourceCards.findIndex((card) => card.id === activeId)
      if (cardIndex === -1) return current

      if (sourceListId === targetListId) {
        const overIndex = sourceCards.findIndex((card) => card.id === overId)
        if (overIndex === -1 || overIndex === cardIndex) return current
        return { ...current, [sourceListId]: arrayMove(sourceCards, cardIndex, overIndex) }
      }

      const remainingSourceCards = [...sourceCards]
      const [movedCard] = remainingSourceCards.splice(cardIndex, 1)
      const targetCards = [...(current[targetListId] ?? [])]
      const overIndex = targetCards.findIndex((card) => card.id === overId)
      const insertIndex = overIndex === -1 ? targetCards.length : overIndex
      targetCards.splice(insertIndex, 0, { ...movedCard, list_id: targetListId })

      return { ...current, [sourceListId]: remainingSourceCards, [targetListId]: targetCards }
    })
  }

  async function handleCardDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const generation = dragGenerationRef.current
    setActiveCard(null)
    const snapshot = dragStartSnapshotRef.current ?? initialCardsByList
    dragStartSnapshotRef.current = null

    // Nur zuruecksetzen, wenn seit diesem Drag kein neuerer Drag begonnen hat -
    // sonst wuerde eine spaet eintreffende Antwort dieses Drags den bereits
    // optimistisch aktualisierten Zustand des naechsten Drags ueberschreiben.
    const rollback = (state: Record<string, Card[]>) => {
      if (dragGenerationRef.current === generation) {
        setCardsByList(state)
      }
    }

    if (!over) {
      rollback(snapshot)
      return
    }

    const cardId = String(active.id)
    const listId = findListId(cardId)
    if (!listId) return

    const listCards = cardsByList[listId] ?? []
    const index = listCards.findIndex((card) => card.id === cardId)
    if (index === -1) return

    const prev = listCards[index - 1]
    const next = listCards[index + 1]

    let newPosition: number
    if (!prev && !next) newPosition = POSITION_STEP
    else if (!prev) newPosition = next.position - POSITION_STEP
    else if (!next) newPosition = prev.position + POSITION_STEP
    else newPosition = (prev.position + next.position) / 2

    // Gleiche Fractional-Ranking-Praezisionsgrenze wie bei Lists (Spec 05):
    // bei Kollision alle Cards dieser Liste auf sichere 1000er-Abstaende rebalancieren.
    const collides =
      (prev && newPosition === prev.position) || (next && newPosition === next.position)

    if (collides) {
      const rebalanced = listCards.map((card, i) => ({ ...card, position: (i + 1) * POSITION_STEP }))
      setCardsByList((current) => ({ ...current, [listId]: rebalanced }))

      const results = await Promise.all(
        rebalanced.map((card) => moveCard(card.id, boardId, listId, card.position)),
      )
      const failed = results.find((result) => result.error)
      if (failed?.error) {
        toast.error(failed.error)
        rollback(snapshot)
      }
      return
    }

    setCardsByList((current) => ({
      ...current,
      [listId]: (current[listId] ?? []).map((card) =>
        card.id === cardId ? { ...card, position: newPosition } : card,
      ),
    }))

    const result = await moveCard(cardId, boardId, listId, newPosition)
    if (result.error) {
      toast.error(result.error)
      rollback(snapshot)
    }
  }

  function handleCardDeleted(listId: string, cardId: string) {
    setCardsByList((current) => ({
      ...current,
      [listId]: (current[listId] ?? []).filter((card) => card.id !== cardId),
    }))
    broadcastDelete(cardId)
  }

  // Broadcast-Empfang: eine ANDERE Session hat diese Card geloescht (die
  // eigene, loeschende Session bekommt ihr eigenes Broadcast nicht zurueck,
  // siehe use-realtime-cards.ts). Card ueberall entfernen, unabhaengig davon,
  // in welcher Liste sie lokal gerade steht.
  function handleRealtimeDelete(cardId: string) {
    setCardsByList((current) => {
      const next: Record<string, Card[]> = {}
      for (const [listId, cards] of Object.entries(current)) {
        next[listId] = cards.filter((card) => card.id !== cardId)
      }
      return next
    })
  }

  // Realtime-INSERT/UPDATE-Echo (auch der eigenen Session) idempotent per
  // Card-ID einsortieren: bestehende labelIds bleiben erhalten (die
  // cards-Tabelle kennt keine Labels, ein Realtime-Payload wuerde sie sonst
  // verlieren), die Card wird aus allen Listen entfernt und in die vom
  // Payload genannte Ziel-Liste neu eingefuegt und nach Position sortiert.
  function handleRealtimeUpsert(row: CardsTableRow) {
    setCardsByList((current) => {
      let existingLabelIds: string[] = []
      for (const cards of Object.values(current)) {
        const found = cards.find((card) => card.id === row.id)
        if (found) {
          existingLabelIds = found.labelIds
          break
        }
      }

      const merged: Card = { ...row, labelIds: existingLabelIds }

      const next: Record<string, Card[]> = {}
      for (const [listId, cards] of Object.entries(current)) {
        next[listId] = cards.filter((card) => card.id !== row.id)
      }
      next[row.list_id] = [...(next[row.list_id] ?? []), merged].sort(
        (a, b) => a.position - b.position,
      )

      return next
    })
  }

  const { broadcastDelete } = useRealtimeCards(boardId, {
    onUpsert: handleRealtimeUpsert,
    onDelete: handleRealtimeDelete,
  })

  async function handleListDragEnd(listId: string) {
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleCardDragStart}
      onDragOver={handleCardDragOver}
      onDragEnd={(event) => void handleCardDragEnd(event)}
      onDragCancel={handleCardDragCancel}
    >
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
              onDragEnd={() => void handleListDragEnd(list.id)}
            >
              <ListColumn
                list={list}
                boardId={boardId}
                boardLabels={boardLabels}
                cards={cardsByList[list.id] ?? []}
                onCardDeleted={(cardId) => handleCardDeleted(list.id, cardId)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <NewListButton boardId={boardId} isFirst={lists.length === 0} />
      </div>

      <DragOverlay>{activeCard ? <CardPreview card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  )
}
