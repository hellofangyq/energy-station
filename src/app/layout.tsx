import "./globals.css";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LanguageProvider } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getServerDict, getServerLang } from "@/lib/i18n-server";

export async function generateMetadata() {
  const t = await getServerDict();
  return {
    title: t.appName,
    description: t.tagline
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  const t = await getServerDict();
  const lang = await getServerLang();
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null;
  const authLink = userId ? { href: "/logout", label: "退出" } : { href: "/login", label: "登录" };
  const canManage = user?.role !== "MEMBER";

  return (
    <html lang={lang}>
      <body className="font-sans" style={{ fontFamily: "var(--font-grotesk)" }}>
        <LanguageProvider initialLang={lang}>
        <div className="min-h-screen">
          <header className="px-5 pt-6 pb-4 md:px-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-ember">{t.appName}</p>
                <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
                  {t.appName}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                {userId ? (
                <nav className="hidden md:flex items-center gap-3 text-sm">
                  <a className="rounded-full bg-white/70 px-3 py-1 hover:text-ember" href="/">{t.nav.bottle}</a>
                  <a className="rounded-full bg-white/70 px-3 py-1 hover:text-ember" href="/new">{t.nav.new}</a>
                  <a className="rounded-full bg-white/70 px-3 py-1 hover:text-ember" href="/timeline">{t.nav.timeline}</a>
                  {canManage ? (
                    <a className="rounded-full bg-white/70 px-3 py-1 hover:text-ember" href="/people">{t.nav.people}</a>
                  ) : null}
                  <a className="rounded-full bg-white/70 px-3 py-1 hover:text-ember" href={authLink.href}>{userId ? t.nav.logout : t.nav.login}</a>
                </nav>
                ) : null}
              </div>
            </div>
            {userId ? (
              <div className="mt-4 flex gap-2 md:hidden text-xs">
                <a className="rounded-full bg-white/70 px-3 py-1" href="/">{t.nav.bottle}</a>
                <a className="rounded-full bg-white/70 px-3 py-1" href="/new">{t.nav.new}</a>
                <a className="rounded-full bg-white/70 px-3 py-1" href="/timeline">{t.nav.timeline}</a>
                {canManage ? <a className="rounded-full bg-white/70 px-3 py-1" href="/people">{t.nav.family}</a> : null}
                <a className="rounded-full bg-white/70 px-3 py-1" href={authLink.href}>{userId ? t.nav.logout : t.nav.login}</a>
              </div>
            ) : null}
          </header>
          <main className="px-5 pb-16 md:px-12">{children}</main>
        </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
