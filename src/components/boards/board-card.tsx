"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  deleteBoard,
  renameBoard,
  type BoardActionState,
} from "@/lib/boards/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type Board = { id: string; name: string; created_at: string }

const initialState: BoardActionState = { data: null, error: null }

export function BoardCard({ board }: { board: Board }) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/60 p-4 shadow-sm ring-1 ring-foreground/5 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/10 focus-within:-translate-y-0.5 focus-within:shadow-lg">
      <Link
        href={`/board/${board.id}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Board „${board.name}“ öffnen`}
      />

      <div className="relative flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 pointer-events-none pr-1 text-sm font-semibold">
          {board.name}
        </h3>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative z-10 shrink-0"
                aria-label={`Menü für Board „${board.name}“`}
              >
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil />
              Umbenennen
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="relative pointer-events-none mt-6 text-xs text-muted-foreground">
        Erstellt {new Date(board.created_at).toLocaleDateString("de-DE")}
      </p>

      <RenameBoardDialog board={board} open={renameOpen} onOpenChange={setRenameOpen} />
      <DeleteBoardDialog board={board} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  )
}

function RenameBoardDialog({
  board,
  open,
  onOpenChange,
}: {
  board: Board
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const renameWithId = renameBoard.bind(null, board.id)
  const [state, formAction, isPending] = useActionState(renameWithId, initialState)

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.data) onOpenChange(false)
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Board umbenennen</DialogTitle>
          <DialogDescription>Neuer Name für „{board.name}“.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`rename-${board.id}`}>Name</Label>
            <Input
              id={`rename-${board.id}`}
              name="name"
              required
              maxLength={100}
              autoFocus
              defaultValue={board.name}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird gespeichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteBoardDialog({
  board,
  open,
  onOpenChange,
}: {
  board: Board
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isPending, setIsPending] = useState(false)

  async function handleDelete() {
    setIsPending(true)
    const result = await deleteBoard(board.id)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Board „{board.name}“ löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Alle Lists, Cards und Labels in diesem Board werden unwiderruflich mitgelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
          >
            {isPending ? "Wird gelöscht…" : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
