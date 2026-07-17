"use client"

import { useEffect, useRef } from "react"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import type { CardPriority } from "@/lib/cards/actions"

export type CardsTableRow = {
  id: string
  board_id: string
  list_id: string
  title: string
  description: string | null
  due_date: string | null
  priority: CardPriority
  focus_slot: number | null
  position: number
  created_at: string
  updated_at: string
}

export type UseRealtimeCardsHandlers = {
  onUpsert: (row: CardsTableRow) => void
  onDelete: (cardId: string) => void
}

// DELETE-Events sind bei Postgres Changes nicht spaltenfilterbar und nicht
// RLS-geschuetzt (der board_id-Filter greift dafuer nicht zuverlaessig) -
// deshalb wird hier bewusst nicht auf DELETE via postgres_changes gehoert.
// Stattdessen sendet die loeschende Session nach erfolgreichem deleteCard()
// per broadcastDelete() ein Broadcast-Event ueber denselben Board-Channel
// (kein DB-Trigger, reines Client-zu-Client-Signal, enthaelt nur die
// Card-ID, keine Inhalte). Das ist das in der Spec vorgesehene
// Tombstone-Pattern als Alternative zum rein lokal-optimistischen Delete.
export function useRealtimeCards(boardId: string, handlers: UseRealtimeCardsHandlers) {
  const handlersRef = useRef(handlers)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`cards-board-${boardId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cards", filter: `board_id=eq.${boardId}` },
        (payload: RealtimePostgresChangesPayload<CardsTableRow>) => {
          if (payload.new && "id" in payload.new) {
            handlersRef.current.onUpsert(payload.new as CardsTableRow)
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cards", filter: `board_id=eq.${boardId}` },
        (payload: RealtimePostgresChangesPayload<CardsTableRow>) => {
          if (payload.new && "id" in payload.new) {
            handlersRef.current.onUpsert(payload.new as CardsTableRow)
          }
        },
      )
      .on("broadcast", { event: "card-deleted" }, ({ payload }) => {
        const cardId = (payload as { cardId?: unknown } | undefined)?.cardId
        if (typeof cardId === "string") {
          handlersRef.current.onDelete(cardId)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [boardId])

  function broadcastDelete(cardId: string) {
    void channelRef.current?.send({
      type: "broadcast",
      event: "card-deleted",
      payload: { cardId },
    })
  }

  return { broadcastDelete }
}
