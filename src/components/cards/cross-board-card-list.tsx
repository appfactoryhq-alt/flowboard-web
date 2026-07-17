"use client"

import { useState } from "react"
import Link from "next/link"

import { CardItem, type Card } from "@/components/cards/card-item"
import type { Label } from "@/lib/labels/types"

export function CrossBoardCardList({
  cards: initialCards,
  boardNameById,
  labelsByBoard,
}: {
  cards: Card[]
  boardNameById: Record<string, string>
  labelsByBoard: Record<string, Label[]>
}) {
  const [cards, setCards] = useState(initialCards)
  const [prevInitialCards, setPrevInitialCards] = useState(initialCards)

  if (initialCards !== prevInitialCards) {
    setPrevInitialCards(initialCards)
    setCards(initialCards)
  }

  const cardsByBoard = new Map<string, Card[]>()
  for (const card of cards) {
    const list = cardsByBoard.get(card.board_id)
    if (list) {
      list.push(card)
    } else {
      cardsByBoard.set(card.board_id, [card])
    }
  }

  const boardGroups = [...cardsByBoard.entries()].sort(([a], [b]) =>
    (boardNameById[a] ?? "").localeCompare(boardNameById[b] ?? ""),
  )

  return (
    <div className="flex flex-col gap-6">
      {boardGroups.map(([boardId, boardCards]) => (
        <div key={boardId} className="flex flex-col gap-2">
          <Link
            href={`/board/${boardId}`}
            className="w-fit text-xs font-medium text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
          >
            {boardNameById[boardId] ?? "Board"}
          </Link>
          <div className="flex flex-col gap-2">
            {boardCards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                boardId={boardId}
                boardLabels={labelsByBoard[boardId] ?? []}
                onDeleted={(cardId) =>
                  setCards((current) => current.filter((c) => c.id !== cardId))
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
