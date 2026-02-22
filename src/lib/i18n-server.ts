import { cookies } from "next/headers";
import { dictionary } from "@/lib/i18n";

export async function getServerDict() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "zh";
  return dictionary[lang];
}

export async function getServerLang(): Promise<"zh" | "en"> {
  const cookieStore = await cookies();
  return cookieStore.get("lang")?.value === "en" ? "en" : "zh";
}
