"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import IntroCards from "@/components/IntroCards";
import { SECURITY_QUESTIONS } from "@/lib/security";
import { useLang, useT } from "@/components/LanguageProvider";
import { translateError } from "@/lib/error-map";

export default function SignupPage() {
  const { t } = useT();
  const { lang } = useLang();
  const [message, setMessage] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{ name: string; ownerName: string } | null>(null);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";

  useEffect(() => {
    let active = true;
    if (!inviteToken) {
      setInviteInfo(null);
      return;
    }
    fetch("/api/invite/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: inviteToken })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.member) {
          setInviteInfo({ name: data.member.name, ownerName: data.member.ownerName });
        } else {
          setInviteInfo(null);
        }
      })
      .catch(() => {
        if (active) setInviteInfo(null);
      });

    return () => {
      active = false;
    };
  }, [inviteToken]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(t.common.loading);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          name: formData.get("name"),
          securityQ1: formData.get("securityQ1"),
          securityA1: formData.get("securityA1"),
          securityQ2: formData.get("securityQ2"),
          securityA2: formData.get("securityA2"),
          inviteToken
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(translateError(data.error, lang) || (lang === "en" ? "Sign up failed" : "注册失败"));
      }
      setMessage(t.auth.signupSuccess);
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (lang === "en" ? "Sign up failed. Please try again." : "注册失败，请稍后再试"));
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.auth.signupTitle}</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          {t.auth.signupTitle}
        </h2>
      </header>

      {!inviteToken ? <IntroCards /> : null}

      {inviteToken ? (
        <div className="gradient-panel rounded-xxl p-4 text-sm text-ink/70">
          {inviteInfo ? (
            <>
              {t.auth.inviteJoinPrefix} <span className="text-ember">{inviteInfo.ownerName}</span> {t.auth.inviteJoinMid}
              <span className="ml-1 text-ember">{inviteInfo.name}</span>
            </>
          ) : (
            <>{t.auth.inviteInvalid}</>
          )}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 space-y-4">
        <input
          name="name"
          type="text"
          required
          placeholder={t.auth.name}
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
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
        <div className="grid gap-3">
          <label className="text-xs text-ink/70">{t.auth.securityQ1}</label>
          <select
            name="securityQ1"
            required
            className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              {t.auth.pickQuestion}
            </option>
            {SECURITY_QUESTIONS.map((q) => (
              <option key={q.value} value={q.value}>
                {lang === "en" ? q.labelEn : q.labelZh}
              </option>
            ))}
          </select>
          <input
            name="securityA1"
            type="text"
            required
            placeholder={t.auth.answer}
            className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
        </div>
        <div className="grid gap-3">
          <label className="text-xs text-ink/70">{t.auth.securityQ2}</label>
          <select
            name="securityQ2"
            required
            className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              {t.auth.pickQuestion}
            </option>
            {SECURITY_QUESTIONS.map((q) => (
              <option key={q.value} value={q.value}>
                {lang === "en" ? q.labelEn : q.labelZh}
              </option>
            ))}
          </select>
          <input
            name="securityA2"
            type="text"
            required
            placeholder={t.auth.answer}
            className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
        </div>
        <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
          {t.auth.signup}
        </button>
        {message && <p className="text-xs text-ink/70">{message}</p>}
        <div className="flex items-center justify-between text-xs">
          <a className="text-ember" href="/login">{t.auth.haveAccount}</a>
          <a className="text-ember" href="/forgot">{t.auth.forgot}</a>
        </div>
      </form>
    </div>
  );
}
