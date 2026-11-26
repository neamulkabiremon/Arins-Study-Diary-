import { redirect } from "next/navigation";

/** Notes live under Together → Notes tab. */
export default function NotesPage() {
  redirect("/together?tab=notes");
}
