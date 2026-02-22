import { cookies } from "next/headers";
import { dictionary } from "@/lib/i18n";

export function getServerDict() {
  const cookieStore = cookies();
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "zh";
  return dictionary[lang];
}

export function getServerLang(): "zh" | "en" {
  const cookieStore = cookies();
  return cookieStore.get("lang")?.value === "en" ? "en" : "zh";
}
