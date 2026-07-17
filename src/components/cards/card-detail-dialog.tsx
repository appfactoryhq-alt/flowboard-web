"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { CalendarIcon, X } from "lucide-react"
import { de } from "date-fns/locale"
import { toast } from "sonner"

import {
  updateCardDescription,
  updateCardDueDate,
  updateCardTitle,
} from "@/lib/cards/actions"
import type { Card } from "@/components/cards/card-item"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const DESCRIPTION_DEBOUNCE_MS = 600

function isoToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function dateToIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function CardDetailDialog({
  card,
  boardId,
  open,
  onOpenChange,
}: {
  card: Card
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? "")
  const [wasOpen, setWasOpen] = useState(open)
  const descriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Felder nur beim Oeffnen (closed -> open) aus der Card uebernehmen, nicht bei
  // jeder Prop-Aenderung waehrend der Dialog offen ist: Server-Revalidierungen
  // (z. B. durch das Bearbeiten einer ANDEREN Card) erzeugen fuer JEDE Card ein
  // neues Objekt, auch ohne inhaltliche Aenderung. Ein Abgleich per Objektidentitaet
  // wuerde dabei unsynchronisierten, noch nicht gespeicherten Text ueberschreiben.
  if (open && !wasOpen) {
    setWasOpen(true)
    setTitle(card.title)
    setDescription(card.description ?? "")
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }

  function saveDescription(value: string) {
    void updateCardDescription(card.id, boardId, value).then((result) => {
      if (result.error) toast.error(result.error)
    })
  }

  function flushPendingDescription() {
    if (descriptionTimerRef.current) {
      clearTimeout(descriptionTimerRef.current)
      descriptionTimerRef.current = null
      if (description !== (card.description ?? "")) {
        saveDescription(description)
      }
    }
  }

  function handleDescriptionChange(value: string) {
    setDescription(value)
    if (descriptionTimerRef.current) clearTimeout(descriptionTimerRef.current)
    descriptionTimerRef.current = setTimeout(() => {
      descriptionTimerRef.current = null
      saveDescription(value)
    }, DESCRIPTION_DEBOUNCE_MS)
  }

  async function handleTitleBlur() {
    const trimmed = title.trim()
    if (!trimmed) {
      setTitle(card.title)
      return
    }
    if (trimmed === card.title) return

    const formData = new FormData()
    formData.set("title", trimmed)
    const result = await updateCardTitle(card.id, boardId, { data: null, error: null }, formData)
    if (result.error) {
      toast.error(result.error)
      setTitle(card.title)
    }
  }

  async function handleDueDateSelect(date: Date | undefined) {
    const result = await updateCardDueDate(card.id, boardId, date ? dateToIso(date) : null)
    if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) flushPendingDescription()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg motion-reduce:data-open:zoom-in-100 motion-reduce:data-closed:zoom-out-100 motion-reduce:duration-0">
        <motion.div layoutId={`card-${card.id}`}>
          <DialogHeader>
            <DialogTitle className="sr-only">Card bearbeiten</DialogTitle>
            <DialogDescription className="sr-only">
              Titel, Beschreibung und Fälligkeitsdatum dieser Card bearbeiten.
            </DialogDescription>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => void handleTitleBlur()}
              maxLength={200}
              className="h-auto border-none px-1 py-1 text-base font-semibold shadow-none focus-visible:ring-0"
            />
          </DialogHeader>
        </motion.div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Beschreibung</span>
            <Textarea
              value={description}
              onChange={(event) => handleDescriptionChange(event.target.value)}
              onBlur={flushPendingDescription}
              placeholder="Details zu dieser Card…"
              rows={5}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Fälligkeitsdatum</span>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" className="justify-start gap-2 text-sm font-normal">
                      <CalendarIcon className="size-3.5" />
                      {card.due_date
                        ? isoToLocalDate(card.due_date).toLocaleDateString("de-DE")
                        : "Kein Datum gesetzt"}
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    locale={de}
                    selected={card.due_date ? isoToLocalDate(card.due_date) : undefined}
                    onSelect={(date) => void handleDueDateSelect(date)}
                  />
                </PopoverContent>
              </Popover>
              {card.due_date ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Fälligkeitsdatum entfernen"
                  onClick={() => void handleDueDateSelect(undefined)}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Erstellt {new Date(card.created_at).toLocaleString("de-DE")} · Zuletzt geändert{" "}
            {new Date(card.updated_at).toLocaleString("de-DE")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
