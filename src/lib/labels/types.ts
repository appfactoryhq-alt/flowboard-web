export const LABEL_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
] as const

export type LabelColor = (typeof LABEL_COLORS)[number]

export type Label = {
  id: string
  name: string
  color: LabelColor
}
