"use client"

import { useActionState, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { createBoard, type BoardActionState } from "@/lib/boards/actions"
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
  DialogTrigger,
} from "@/components/ui/dialog"

const initialState: BoardActionState = { data: null, error: null }

export function NewBoardDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createBoard, initialState)

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Neues Board
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Board</DialogTitle>
          <DialogDescription>Gib deinem Board einen Namen.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-board-name">Name</Label>
            <Input
              id="new-board-name"
              name="name"
              required
              maxLength={100}
              autoFocus
              placeholder="z. B. Umzug 2026"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird angelegt…" : "Board anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
