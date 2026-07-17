"use client"

import { useActionState, useEffect } from "react"
import { LogOut, User } from "lucide-react"
import { toast } from "sonner"

import { logout, type AuthActionState } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const initialState: AuthActionState = { data: null, error: null, info: null }

export function AppHeader({ email }: { email: string | null }) {
  const [state, formAction, isPending] = useActionState(logout, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-gradient-to-b from-background to-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-md bg-gradient-to-br from-primary to-primary/40" />
        <span className="text-sm font-semibold tracking-tight">Flow Board</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Benutzermenü öffnen"
            >
              <User />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {email ? (
            <>
              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <form action={formAction} className="w-full">
            <DropdownMenuItem
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault()
                event.currentTarget.closest("form")?.requestSubmit()
              }}
              variant="destructive"
            >
              <LogOut />
              {isPending ? "Abmelden…" : "Abmelden"}
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
