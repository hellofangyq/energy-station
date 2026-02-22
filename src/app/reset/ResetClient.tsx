"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useT } from "@/components/LanguageProvider";
import { translateError } from "@/lib/error-map";

export default function ResetClient() {
  const { t, lang } = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("token");
    if (fromQuery) setToken(fromQuery);
  }, [searchParams]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(t.common.loading);

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(translateError(data.error, lang) || (lang === "en" ? "Reset failed" : "重置失败"));
      setMessage(lang === "en" ? "Password updated. Please login." : "密码已更新，请登录");
      router.push("/login");
    } catch (error) {
      setMessage(lang === "en" ? "Reset failed. The link may be invalid." : "重置失败，请检查链接是否有效");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.auth.resetTitle}</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          {lang === "en" ? "Set new password" : "设置新密码"}
        </h2>
      </header>

      <form onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 space-y-4">
        <input
          name="token"
          type="text"
          required
          placeholder={lang === "en" ? "Reset token" : "重置码/链接里的 token"}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          placeholder={t.auth.newPassword}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
          {t.auth.resetSubmit}
        </button>
        {message && <p className="text-xs text-ink/70">{message}</p>}
        <a className="text-xs text-ember" href="/login">{t.common.backLogin}</a>
      </form>
    </div>
  );
}
