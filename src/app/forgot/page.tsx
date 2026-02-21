"use client";

import { useState } from "react";

export default function ForgotPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [tokenHint, setTokenHint] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("正在发送重置链接...");
    setTokenHint(null);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "发送失败");
      setMessage("如果邮箱存在，重置链接已发送。");
      if (data.resetToken) {
        setTokenHint(data.resetToken);
      }
    } catch (error) {
      setMessage("发送失败，请稍后再试。");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">找回密码</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          重置密码
        </h2>
      </header>

      <form onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="注册邮箱"
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
          发送重置链接
        </button>
        {message && <p className="text-xs text-ink/70">{message}</p>}
        {tokenHint && (
          <p className="text-xs text-ink/60">
            开发模式重置码：<span className="text-ember">{tokenHint}</span>
          </p>
        )}
        <a className="text-xs text-ember" href="/login">返回登录</a>
      </form>
    </div>
  );
}
