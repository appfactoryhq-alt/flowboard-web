"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { createList, type ListActionState } from "@/lib/lists/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const initialState: ListActionState = { data: null, error: null }

export function NewListButton({
  boardId,
  isFirst = false,
}: {
  boardId: string
  isFirst?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const createWithBoard = createList.bind(null, boardId)
  const [state, formAction, isPending] = useActionState(createWithBoard, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
      return
    }
    if (state.data) {
      formRef.current?.reset()
    }
  }, [state])

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        onClick={() => {
          cancelledRef.current = false
          setIsEditing(true)
        }}
        className="h-auto w-72 shrink-0 justify-start gap-2 rounded-2xl border border-dashed border-border/60 py-3 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
      >
        <Plus />
        {isFirst ? "Erste Liste anlegen" : "Liste hinzufügen"}
      </Button>
    )
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="w-72 shrink-0 rounded-2xl border border-border/60 bg-muted/20 p-3"
    >
      <Input
        name="name"
        autoFocus
        maxLength={60}
        disabled={isPending}
        placeholder="Name der Liste"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            cancelledRef.current = true
            setIsEditing(false)
          }
        }}
        onBlur={(event) => {
          if (cancelledRef.current) {
            cancelledRef.current = false
            return
          }
          if (!event.currentTarget.value.trim()) {
            setIsEditing(false)
            return
          }
          formRef.current?.requestSubmit()
        }}
      />
    </form>
  )
}
