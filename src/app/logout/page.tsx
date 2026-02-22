"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LanguageProvider";

export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { lang } = useT();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (!res.ok) {
          throw new Error("logout_failed");
        }
        if (!cancelled) {
          window.location.href = "/";
        }
      } catch {
        if (!cancelled) {
          setError(lang === "en" ? "Logout failed. Please try again." : "退出失败，请稍后重试");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[28px] border border-white/40 bg-white/75 p-6 text-center shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
        <h1 className="text-xl font-semibold">{lang === "en" ? "Logging out..." : "正在退出..."}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {error ?? (lang === "en" ? "Please wait" : "请稍候")}
        </p>
        {error ? (
          <button
            className="mt-5 w-full rounded-full bg-slate-900 py-2 text-sm font-semibold text-white"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            {lang === "en" ? "Back to login" : "返回登录"}
          </button>
        ) : null}
      </div>
    </main>
  );
}
