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
      if (!response.ok) throw new Error("注册失败");
      setMessage("注册成功，请登录");
    } catch (error) {
      setMessage("注册失败，请稍后再试");
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
        <a className="text-xs text-ember" href="/login">已有账号？登录</a>
      </form>
    </div>
  );
}
