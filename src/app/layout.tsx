import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "能量站",
  description: "记录闪光点，让能量继续流动"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="font-sans" style={{ fontFamily: "var(--font-grotesk)" }}>
        <div className="min-h-screen">
          <header className="px-5 pt-6 pb-4 md:px-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-ember">Energy Station</p>
                <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
                  能量站
                </h1>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-sm">
                <a className="hover:text-ember" href="/">能量瓶</a>
                <a className="hover:text-ember" href="/new">写能量</a>
                <a className="hover:text-ember" href="/timeline">时间轴</a>
                <a className="hover:text-ember" href="/people">管理家庭</a>
              </nav>
            </div>
            <div className="mt-4 flex gap-2 md:hidden text-xs">
              <a className="rounded-full bg-white/70 px-3 py-1" href="/">能量瓶</a>
              <a className="rounded-full bg-white/70 px-3 py-1" href="/new">写能量</a>
              <a className="rounded-full bg-white/70 px-3 py-1" href="/timeline">时间轴</a>
              <a className="rounded-full bg-white/70 px-3 py-1" href="/people">家庭</a>
            </div>
          </header>
          <main className="px-5 pb-16 md:px-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
