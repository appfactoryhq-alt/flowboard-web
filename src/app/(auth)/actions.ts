"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AuthActionState = {
  data: null
  error: string | null
  info: string | null
}

function readCredentials(formData: FormData): { email: string; password: string } | null {
  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return null
  }

  return { email, password }
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData)

  if (!credentials) {
    return { data: null, error: "Email und Passwort sind erforderlich.", info: null }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp(credentials)

  if (error) {
    return { data: null, error: error.message, info: null }
  }

  if (!data.session) {
    return {
      data: null,
      error: null,
      info: "Konto erstellt. Bitte bestätige deine Email-Adresse, um dich anzumelden.",
    }
  }

  redirect("/board")
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData)

  if (!credentials) {
    return { data: null, error: "Email und Passwort sind erforderlich.", info: null }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    return { data: null, error: error.message, info: null }
  }

  redirect("/board")
}

export async function logout(): Promise<AuthActionState> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { data: null, error: error.message, info: null }
  }

  redirect("/login")
}
