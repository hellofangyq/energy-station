"use client";

import IntroBottle from "@/components/IntroBottle";
import { useT } from "@/components/LanguageProvider";

export default function IntroCards() {
  const { t } = useT();
  return (
    <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
      <div className="relative flex items-center justify-center">
        <IntroBottle />
      </div>
      <div className="relative min-h-[280px]">
        <div className="floaty rounded-xxl border border-ember/20 bg-ember/10 p-4 text-ember-900 shadow-[0_20px_40px_-30px_rgba(155,91,43,0.5)] md:absolute md:left-4 md:top-2">
          <p className="text-sm font-semibold text-ember-900">{t.home.intro1Title}</p>
          <p className="text-xs text-ember-900/70">{t.home.intro1Text}</p>
        </div>
        <div className="floaty floaty-delay-1 rounded-xxl border border-ember/20 bg-ember/10 p-4 text-ember-900 shadow-[0_20px_40px_-30px_rgba(155,91,43,0.5)] md:absolute md:right-6 md:top-20">
          <p className="text-sm font-semibold text-ember-900">{t.home.intro2Title}</p>
          <p className="text-xs text-ember-900/70">{t.home.intro2Text}</p>
        </div>
        <div className="floaty floaty-delay-2 rounded-xxl border border-ember/20 bg-ember/10 p-4 text-ember-900 shadow-[0_20px_40px_-30px_rgba(155,91,43,0.5)] md:absolute md:left-10 md:bottom-4">
          <p className="text-sm font-semibold text-ember-900">{t.home.intro3Title}</p>
          <p className="text-xs text-ember-900/70">{t.home.intro3Text}</p>
        </div>
      </div>
    </section>
  );
}
