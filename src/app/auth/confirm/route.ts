import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const VALID_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]

function parseOtpType(value: string | null): EmailOtpType | null {
  return VALID_OTP_TYPES.includes(value as EmailOtpType) ? (value as EmailOtpType) : null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = parseOtpType(searchParams.get("type"))

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = "/board"
  redirectTo.searchParams.delete("token_hash")
  redirectTo.searchParams.delete("type")

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  redirectTo.pathname = "/login"
  redirectTo.searchParams.set("error", "confirm-failed")
  return NextResponse.redirect(redirectTo)
}
