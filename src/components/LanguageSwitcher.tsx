"use client";

import { useLang } from "@/components/LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="relative">
      <select
        value={lang}
        onChange={(e) => {
          setLang(e.target.value as "zh" | "en");
          window.location.reload();
        }}
        className="rounded-full bg-white/70 px-3 py-1 text-xs text-ink/70"
        aria-label="Language"
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
