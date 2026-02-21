"use client";

import { useState } from "react";

export default function SignupPage() {
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("正在创建账号...");
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          name: formData.get("name")
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "注册失败");
      }
      setMessage("注册成功，请登录");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "注册失败，请稍后再试");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">创建账号</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          开始记录能量
        </h2>
      </header>

      <section className="grid gap-3">
        <div className="gradient-panel rounded-xxl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/10 text-ember">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 4h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">给自己写能量纸条</p>
              <p className="text-xs text-ink/70">记录你的努力和闪光点。</p>
            </div>
          </div>
        </div>
        <div className="gradient-panel rounded-xxl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/10 text-ember">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M7 11a4 4 0 1 1 8 0" />
                <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">给家庭成员写纸条</p>
              <p className="text-xs text-ink/70">把鼓励送到彼此的能量瓶里。</p>
            </div>
          </div>
        </div>
        <div className="gradient-panel rounded-xxl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/10 text-ember">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3c3 0 5 2 5 5v10a3 3 0 0 1-6 0V10a2 2 0 1 1 4 0v7" />
                <path d="M4 21h16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">摇出自己的能量</p>
              <p className="text-xs text-ink/70">在能量瓶里随机回忆成功时刻。</p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 space-y-4">
        <input
          name="name"
          type="text"
          required
          placeholder="姓名"
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="邮箱"
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="密码"
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
          注册
        </button>
        {message && <p className="text-xs text-ink/70">{message}</p>}
        <div className="flex items-center justify-between text-xs">
          <a className="text-ember" href="/login">已有账号？登录</a>
          <a className="text-ember" href="/forgot">忘记密码</a>
        </div>
      </form>
    </div>
  );
}
