import LoginForm from "@/components/LoginForm";
import { getServerDict } from "@/lib/i18n-server";

export default async function LoginPage() {
  const t = await getServerDict();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.auth.loginTitle}</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          {t.home.welcome}
        </h2>
      </header>

      <LoginForm />
    </div>
  );
}
