"use client"

import { useActionState, useEffect, useState } from "react"
import { Check, Plus, Tag, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  assignLabel,
  createLabel,
  deleteLabel,
  unassignLabel,
  type LabelActionState,
} from "@/lib/labels/actions"
import { LABEL_COLORS, type Label, type LabelColor } from "@/lib/labels/types"
import { LABEL_SWATCH_STYLES } from "@/lib/labels/colors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function LabelPicker({
  cardId,
  boardId,
  boardLabels,
  assignedLabelIds,
}: {
  cardId: string
  boardId: string
  boardLabels: Label[]
  assignedLabelIds: string[]
}) {
  const [pendingLabelId, setPendingLabelId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function toggleLabel(labelId: string, isAssigned: boolean) {
    setPendingLabelId(labelId)
    const result = isAssigned
      ? await unassignLabel(cardId, labelId, boardId)
      : await assignLabel(cardId, labelId, boardId)
    setPendingLabelId(null)
    if (result.error) toast.error(result.error)
  }

  async function handleDeleteLabel(labelId: string) {
    setPendingLabelId(labelId)
    const result = await deleteLabel(labelId, boardId)
    setPendingLabelId(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Label gelöscht.")
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Tag className="size-3.5" />
            Labels
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-2">
        <div className="flex flex-col gap-0.5">
          {boardLabels.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              Noch keine Labels auf diesem Board.
            </p>
          ) : (
            boardLabels.map((label) => {
              const isAssigned = assignedLabelIds.includes(label.id)
              const isPending = pendingLabelId === label.id
              return (
                <div
                  key={label.id}
                  className="group/label-row flex items-center rounded-md transition-colors duration-150 ease-out hover:bg-muted/60"
                >
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void toggleLabel(label.id, isAssigned)}
                    className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm disabled:opacity-50"
                  >
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        LABEL_SWATCH_STYLES[label.color],
                      )}
                    />
                    <span className="flex-1 truncate">{label.name}</span>
                    {isAssigned ? <Check className="size-3.5 shrink-0" /> : null}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    aria-label={`Label „${label.name}“ löschen`}
                    onClick={() => void handleDeleteLabel(label.id)}
                    className="mr-1 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover/label-row:opacity-100 hover:text-destructive focus-visible:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-1 border-t border-border/60 pt-1">
          {creating ? (
            <NewLabelForm boardId={boardId} onDone={() => setCreating(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/60 hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Neues Label
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const initialLabelState: LabelActionState = { data: null, error: null }

function NewLabelForm({ boardId, onDone }: { boardId: string; onDone: () => void }) {
  const createWithBoard = createLabel.bind(null, boardId)
  const [state, formAction, isPending] = useActionState(createWithBoard, initialLabelState)
  const [prevState, setPrevState] = useState(state)
  const [color, setColor] = useState<LabelColor>(LABEL_COLORS[0])

  if (state !== prevState) {
    setPrevState(state)
    if (state.data) onDone()
  }

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  return (
    <form action={formAction} className="flex flex-col gap-2 p-1">
      <Input
        name="name"
        placeholder="Label-Name"
        maxLength={40}
        autoFocus
        disabled={isPending}
        className="h-7 text-sm"
      />
      <input type="hidden" name="color" value={color} />
      <div className="flex flex-wrap gap-1.5">
        {LABEL_COLORS.map((presetColor) => (
          <button
            key={presetColor}
            type="button"
            aria-label={`Farbe ${presetColor}`}
            aria-pressed={color === presetColor}
            onClick={() => setColor(presetColor)}
            className={cn(
              "size-5 rounded-full transition-transform duration-150 ease-out",
              LABEL_SWATCH_STYLES[presetColor],
              color === presetColor
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-popover"
                : "hover:scale-110",
            )}
          />
        ))}
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Wird angelegt…" : "Anlegen"}
      </Button>
    </form>
  )
}
