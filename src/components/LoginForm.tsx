"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LanguageProvider";

export default function LoginForm() {
  const { t } = useT();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(t.common.loading);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });
      if (!response.ok) throw new Error("FAILED");
      setMessage(t.auth.loginSuccess);
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(t.auth.loginFail);
    }
  };

  return (
    <form onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 space-y-4">
      <input
        name="email"
        type="email"
        required
        placeholder={t.auth.email}
        className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
      />
      <input
        name="password"
        type="password"
        required
        placeholder={t.auth.password}
        className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
      />
      <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
        {t.auth.login}
      </button>
      {message && <p className="text-xs text-ink/70">{message}</p>}
      <div className="flex items-center justify-between text-xs">
        <a className="text-ember" href="/signup">{t.auth.noAccount}</a>
        <a className="text-ember" href="/forgot">{t.auth.forgot}</a>
      </div>
    </form>
  );
}
