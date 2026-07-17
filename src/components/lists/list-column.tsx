"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteList, renameList, type ListActionState } from "@/lib/lists/actions"
import { type Card } from "@/components/cards/card-item"
import { SortableCard } from "@/components/cards/sortable-card"
import { QuickAddCard } from "@/components/cards/quick-add-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type List = { id: string; name: string; position: number }

const initialState: ListActionState = { data: null, error: null }

export function ListColumn({
  list,
  boardId,
  cards,
  onCardDeleted,
}: {
  list: List
  boardId: string
  cards: Card[]
  onCardDeleted: (cardId: string) => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: list.id,
    data: { type: "list" },
  })

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteList(list.id, boardId)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setDeleteOpen(false)
  }

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-b from-muted/30 to-muted/10 p-3 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-center justify-between gap-2">
        <ListNameEditor list={list} boardId={boardId} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 cursor-grab active:cursor-grabbing"
                aria-label={`Menü für Liste „${list.name}“`}
              >
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={setDroppableRef} className="flex min-h-16 flex-col gap-2">
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} boardId={boardId} onDeleted={onCardDeleted} />
          ))}
        </SortableContext>
        <QuickAddCard listId={list.id} boardId={boardId} />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liste „{list.name}“ löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle Cards in dieser Liste werden unwiderruflich mitgelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {isDeleting ? "Wird gelöscht…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ListNameEditor({ list, boardId }: { list: List; boardId: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const renameWithIds = renameList.bind(null, list.id, boardId)
  const [state, formAction, isPending] = useActionState(renameWithIds, initialState)
  const [prevState, setPrevState] = useState(state)
  const formRef = useRef<HTMLFormElement>(null)
  const cancelledRef = useRef(false)

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

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          cancelledRef.current = false
          setIsEditing(true)
        }}
        className="min-w-0 flex-1 truncate rounded-md px-1 py-0.5 text-left text-sm font-semibold transition-colors duration-150 ease-out hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {list.name}
      </button>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="flex-1">
      <Input
        name="name"
        defaultValue={list.name}
        autoFocus
        maxLength={60}
        disabled={isPending}
        className="h-7 text-sm font-semibold"
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
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
  )
}
