import type { LabelColor } from "@/lib/labels/types"

export const LABEL_BADGE_STYLES: Record<LabelColor, string> = {
  gray: "bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/30",
  red: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  orange: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30",
  amber: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  green: "bg-green-500/15 text-green-300 ring-1 ring-green-500/30",
  cyan: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
  blue: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  purple: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30",
  pink: "bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30",
}

export const LABEL_SWATCH_STYLES: Record<LabelColor, string> = {
  gray: "bg-gray-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  cyan: "bg-cyan-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
}
