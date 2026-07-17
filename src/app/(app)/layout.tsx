import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageTransition } from "@/components/layout/page-transition"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <AppHeader email={email} />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
