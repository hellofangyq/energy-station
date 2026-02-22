"use client";

import { useState } from "react";
import { useLang, useT } from "@/components/LanguageProvider";
import { getQuestionLabel } from "@/lib/security";
import { translateError } from "@/lib/error-map";

export default function ForgotPage() {
  const { t } = useT();
  const { lang } = useLang();
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "questions">("email");
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);

  const onFindQuestions = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(t.common.loading);
    const formData = new FormData(event.currentTarget);
    const nextEmail = String(formData.get("email") ?? "").toLowerCase();

    try {
      const response = await fetch("/api/auth/security-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(translateError(data.error, lang) || (lang === "en" ? "Failed to continue" : "发送失败"));
      setEmail(nextEmail);
      if (Array.isArray(data.questions) && data.questions.length === 2) {
        setQuestions(data.questions);
        setStep("questions");
        setMessage(null);
      } else {
        setMessage(t.auth.sent);
      }
    } catch (error) {
      setMessage(lang === "en" ? "Failed. Please try again." : "操作失败，请稍后再试。");
    }
  };

  const onReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(t.common.loading);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/reset-with-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          answer1: formData.get("answer1"),
          answer2: formData.get("answer2"),
          newPassword: formData.get("newPassword")
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(translateError(data.error, lang) || (lang === "en" ? "Reset failed" : "重置失败"));
      setMessage(t.auth.resetSuccess);
      setTimeout(() => {
        window.location.href = "/login";
      }, 600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (lang === "en" ? "Reset failed. Please try again." : "重置失败，请稍后再试。"));
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.auth.forgotTitle}</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          {t.auth.resetTitle}
        </h2>
      </header>

      {step === "email" ? (
        <form onSubmit={onFindQuestions} className="gradient-panel rounded-xxl p-6 space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder={t.auth.email}
            className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
          <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
            {t.auth.next}
          </button>
          {message && <p className="text-xs text-ink/70">{message}</p>}
          <a className="text-xs text-ember" href="/login">{t.common.backLogin}</a>
        </form>
      ) : (
        <form onSubmit={onReset} className="gradient-panel rounded-xxl p-6 space-y-4">
          <div className="text-xs text-ink/60">{t.auth.email}：{email}</div>
          <div className="grid gap-2">
            <label className="text-xs text-ink/70">{getQuestionLabel(questions[0] ?? "", lang) || t.auth.securityQ1}</label>
            <input
              name="answer1"
              type="text"
              required
              placeholder={t.auth.answer}
              className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-ink/70">{getQuestionLabel(questions[1] ?? "", lang) || t.auth.securityQ2}</label>
            <input
              name="answer2"
              type="text"
              required
              placeholder={t.auth.answer}
              className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
          <p className="text-xs text-ink/60">{t.auth.resetPrompt}</p>
          <input
            name="newPassword"
            type="password"
            required
            placeholder={t.auth.newPassword}
            className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
          <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
            {t.auth.resetSubmit}
          </button>
          {message && <p className="text-xs text-ink/70">{message}</p>}
          <a className="text-xs text-ember" href="/login">{t.common.backLogin}</a>
        </form>
      )}
    </div>
  );
}
