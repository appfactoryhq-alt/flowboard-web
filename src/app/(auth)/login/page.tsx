"use client"

import Link from "next/link"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

import { login, type AuthActionState } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initialState: AuthActionState = { data: null, error: null, info: null }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>Melde dich mit Email und Passwort an.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Noch kein Konto?{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            Registrieren
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
