import { revalidatePath } from "next/cache"

// Card-Aenderungen (Titel, Beschreibung, Faelligkeitsdatum, Priority, Labels,
// Position, Focus-Status) koennen sich auf mehrere Ansichten auswirken, die
// alle direkt aus derselben cards-Tabelle lesen: das jeweilige Board sowie die
// board-uebergreifenden Smart-Views "Heute" und "Focus". revalidatePath deckt
// jeweils nur den uebergebenen Pfad ab, deshalb zentral an einer Stelle
// pflegen statt in jeder Server-Action-Datei einzeln zu wiederholen.
export function revalidateCardViews(boardId: string) {
  revalidatePath(`/board/${boardId}`)
  revalidatePath("/today")
  revalidatePath("/focus")
}
