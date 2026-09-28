import { redirect } from "next/navigation";
/** Legacy judge link retained for presentations; official view now has a clear route. */
export default function JudgeRedirect() { redirect("/admin"); }
