"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"

import { logout, type AuthActionState } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

const initialState: AuthActionState = { data: null, error: null, info: null }

export default function BoardPage() {
  const [state, formAction, isPending] = useActionState(logout, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground">Board-Ansicht folgt in Spec 04.</p>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Abmelden…" : "Abmelden"}
        </Button>
      </form>
    </div>
  )
}
