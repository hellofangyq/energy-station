"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("正在登录...");
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
      if (!response.ok) throw new Error("登录失败");
      setMessage("登录成功");
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage("登录失败，请检查邮箱或密码");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">账号登录</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          欢迎回来
        </h2>
      </header>

      <form onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 space-y-4">
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
          登录
        </button>
        {message && <p className="text-xs text-ink/70">{message}</p>}
        <a className="text-xs text-ember" href="/signup">没有账号？注册</a>
      </form>
    </div>
  );
}
