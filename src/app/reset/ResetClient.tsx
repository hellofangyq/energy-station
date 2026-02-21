"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetClient() {
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
    setMessage("正在重置密码...");

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "重置失败");
      setMessage("密码已更新，请登录");
      router.push("/login");
    } catch (error) {
      setMessage("重置失败，请检查链接是否有效");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">重置密码</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          设置新密码
        </h2>
      </header>

      <form onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 space-y-4">
        <input
          name="token"
          type="text"
          required
          placeholder="重置码/链接里的 token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="新密码"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
        />
        <button className="w-full rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
          重置密码
        </button>
        {message && <p className="text-xs text-ink/70">{message}</p>}
        <a className="text-xs text-ember" href="/login">返回登录</a>
      </form>
    </div>
  );
}
