"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Search } from "lucide-react"
import { toast } from "sonner"

import { searchCards, type SearchResult } from "@/lib/search/actions"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = value.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      requestIdRef.current += 1
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const requestId = ++requestIdRef.current
    debounceRef.current = setTimeout(() => {
      void searchCards(trimmed).then((result) => {
        // Veraltete Antworten (langsamere fruehere Anfrage kommt nach einer
        // neueren zurueck) duerfen aktuellere Ergebnisse nicht ueberschreiben.
        if (requestId !== requestIdRef.current) return

        setIsSearching(false)
        if (result.error) {
          toast.error(result.error)
          return
        }
        setResults(result.data ?? [])
      })
    }, SEARCH_DEBOUNCE_MS)
  }

  function handleSelect(result: SearchResult) {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(`/board/${result.board_id}?card=${result.id}`)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-muted-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Suchen…</span>
        <kbd className="ml-1 hidden rounded border border-border/60 bg-muted px-1 font-mono text-[0.65rem] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Cards durchsuchen"
        description="Suche nach Titel oder Beschreibung deiner Cards."
      >
        {/* cmdk-Primitives (CommandInput/-List/...) brauchen den Command-Context;
            CommandDialog rendert children ohne eigenen Command-Wrapper. */}
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={handleQueryChange}
            placeholder="Cards durchsuchen…"
          />
          <CommandList>
            {query.trim().length < MIN_QUERY_LENGTH ? (
              <CommandEmpty>Mindestens {MIN_QUERY_LENGTH} Zeichen eingeben.</CommandEmpty>
            ) : isSearching ? (
              <CommandEmpty>Suche läuft…</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>Keine Treffer.</CommandEmpty>
            ) : (
              <CommandGroup heading="Cards">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="text-sm">{result.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {result.boards?.name ?? "Board"} · {result.lists?.name ?? "Liste"}
                      {result.due_date ? (
                        <span className="flex items-center gap-0.5">
                          <CalendarDays className="size-3" />
                          {new Date(result.due_date).toLocaleDateString("de-DE", {
                            timeZone: "UTC",
                          })}
                        </span>
                      ) : null}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
