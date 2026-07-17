import { LABEL_BADGE_STYLES } from "@/lib/labels/colors"
import type { Label } from "@/lib/labels/types"
import { cn } from "@/lib/utils"

export function LabelBadge({ label, className }: { label: Label; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium",
        LABEL_BADGE_STYLES[label.color],
        className,
      )}
    >
      {label.name}
    </span>
  )
}
