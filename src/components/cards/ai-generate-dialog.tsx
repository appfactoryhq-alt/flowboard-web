"use client"

import { useState } from "react"
import { useObject } from "@ai-sdk/react"
import { motion } from "motion/react"
import { Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { createCardFromSuggestion } from "@/lib/cards/actions"
import { generatedCardSchema } from "@/lib/ai/card-schema"
import { PriorityDot } from "@/components/cards/priority-select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Output.array() auf dem Server kapselt das Array serverseitig als
// { elements: [...] } (Vorgabe von OpenAIs Structured-Outputs-Strict-Modus,
// der kein Array als Root-Schema erlaubt). useObject parst den Stream ohne
// eigene Entpackung, das Client-Schema muss diese Form deshalb exakt
// spiegeln - empirisch am rohen Stream-Text verifiziert, nicht nur vermutet.
const suggestionsResponseSchema = z.object({ elements: z.array(generatedCardSchema) })

export function AiGenerateDialog({ listId, boardId }: { listId: string; boardId: string }) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [addedIndexes, setAddedIndexes] = useState<Set<number>>(new Set())
  const [addingIndex, setAddingIndex] = useState<number | null>(null)
  const [addingAll, setAddingAll] = useState(false)

  const { object, submit, isLoading, error } = useObject({
    api: "/api/cards/generate",
    schema: suggestionsResponseSchema,
  })

  // Waehrend des Streamings liefert useObject DeepPartial-Zwischenstaende -
  // ein Element kann bereits einen Titel haben, waehrend description/priority
  // noch nicht eingetroffen sind. Ein reines "hat einen Titel"-Filter wuerde
  // dem Type Predicate faelschlich volle Schema-Konformitaet vorgaukeln und
  // liesse "Uebernehmen" auf einem noch unvollstaendigen Vorschlag zu (fuehrt
  // serverseitig zu einer verwirrenden Fehlermeldung statt Datenverlust,
  // aber vermeidbar). Volle Schema-Validierung statt nur Title-Check.
  const suggestions = (object?.elements ?? []).filter(
    (item): item is z.infer<typeof generatedCardSchema> => generatedCardSchema.safeParse(item).success,
  )

  async function handleAdd(index: number) {
    const suggestion = suggestions[index]
    if (!suggestion) return

    setAddingIndex(index)
    const result = await createCardFromSuggestion(listId, boardId, suggestion)
    setAddingIndex(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setAddedIndexes((current) => new Set(current).add(index))
  }

  async function handleAddAll() {
    setAddingAll(true)
    for (let index = 0; index < suggestions.length; index++) {
      if (addedIndexes.has(index)) continue
      // Sequenziell statt Promise.all, damit die Positionsberechnung
      // (max(position) je Liste) nicht durch parallele Inserts kollidiert.
      await handleAdd(index)
    }
    setAddingAll(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setPrompt("")
      setAddedIndexes(new Set())
    }
  }

  const allAdded = suggestions.length > 0 && addedIndexes.size === suggestions.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="size-3.5" />
            Cards per AI generieren
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cards per AI generieren</DialogTitle>
          <DialogDescription>
            Beschreibe dein Vorhaben in Stichworten, die AI schlägt passende Cards vor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="z. B. Umzug organisieren"
            rows={2}
            disabled={isLoading}
          />
          <Button
            type="button"
            disabled={isLoading || prompt.trim().length < 1}
            onClick={() => {
              setAddedIndexes(new Set())
              void submit(prompt.trim())
            }}
            className="self-start"
          >
            {isLoading ? "Generiere…" : "Vorschläge generieren"}
          </Button>

          {error ? (
            <p className="text-sm text-destructive">
              Vorschläge konnten nicht geladen werden. Bitte erneut versuchen.
            </p>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {suggestions.map((suggestion, index) => {
                const isAdded = addedIndexes.has(index)
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {suggestion.priority ? <PriorityDot priority={suggestion.priority} /> : null}
                        <p className="truncate text-sm font-medium">{suggestion.title}</p>
                      </div>
                      {suggestion.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {suggestion.description}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isAdded ? "secondary" : "outline"}
                      disabled={isAdded || addingIndex === index || addingAll}
                      onClick={() => void handleAdd(index)}
                      className="shrink-0 gap-1"
                    >
                      {isAdded ? (
                        <>
                          <Check className="size-3.5" />
                          Übernommen
                        </>
                      ) : addingIndex === index ? (
                        "…"
                      ) : (
                        "Übernehmen"
                      )}
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          ) : null}
        </div>

        {suggestions.length > 0 ? (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={addingAll || allAdded}
              onClick={() => void handleAddAll()}
            >
              {allAdded ? "Alle übernommen" : addingAll ? "Übernehme…" : "Alle übernehmen"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
