import { redirect } from "next/navigation";

/** Legacy path — notes & claims live at /notes for both of you. */
export default function EmonPage() {
  redirect("/notes");
}
