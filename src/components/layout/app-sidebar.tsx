"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Sparkles, Target } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const NAV_ITEMS = [
  { href: "/board", label: "Boards", icon: LayoutGrid, disabled: false },
  {
    href: "/today",
    label: "Heute",
    icon: Sparkles,
    disabled: true,
    disabledHint: "Kommt in Spec 10",
  },
  {
    href: "/focus",
    label: "Focus",
    icon: Target,
    disabled: true,
    disabledHint: "Kommt in Spec 11",
  },
] as const

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border/60 bg-gradient-to-b from-muted/40 to-transparent p-3 sm:flex sm:flex-col sm:gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        const link = (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            aria-disabled={item.disabled}
            aria-current={isActive ? "page" : undefined}
            tabIndex={item.disabled ? -1 : undefined}
            onClick={(event) => {
              if (item.disabled) event.preventDefault()
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ease-out",
              item.disabled
                ? "cursor-not-allowed text-muted-foreground/50"
                : isActive
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:bg-muted/60 focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )

        if (!item.disabled) return link

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger render={link} />
            <TooltipContent side="right">{item.disabledHint}</TooltipContent>
          </Tooltip>
        )
      })}
    </aside>
  )
}
