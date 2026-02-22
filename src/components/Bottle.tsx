"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import type { NotePreview } from "@/lib/types";
import { useT } from "@/components/LanguageProvider";

function randomFrom(list: NotePreview[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function weightedPick(list: NotePreview[], tauDays = 7, epsilon = 0.12) {
  const now = Date.now();
  const weights = list.map((note) => {
    const eventAt = new Date(note.eventDateISO).getTime();
    const days = Math.max(0, (now - eventAt) / (1000 * 60 * 60 * 24));
    return Math.exp(-days / tauDays) + epsilon;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

const mediaIcons: Record<NotePreview["mediaType"], ReactElement | null> = {
  text: null,
  image: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-ember" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M7 14l3-3 4 4 3-3 3 4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1.4" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-ember" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 10v4" strokeLinecap="round" />
      <path d="M9 8v8" strokeLinecap="round" />
      <path d="M13 6v12" strokeLinecap="round" />
      <path d="M17 9v6" strokeLinecap="round" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-ember" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="6" width="14" height="12" rx="2.5" />
      <path d="M17 10l4-2v8l-4-2z" strokeLinejoin="round" />
      <path d="M9 10l3 2-3 2z" fill="currentColor" stroke="none" />
    </svg>
  )
};

export default function Bottle({
  notes,
  memberName
}: {
  notes: NotePreview[];
  memberName: string;
}) {
  const [current, setCurrent] = useState<NotePreview | null>(notes[0] ?? null);
  const [shake, setShake] = useState(false);
  const [opened, setOpened] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [corkOpen, setCorkOpen] = useState(false);
  const [openMedia, setOpenMedia] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastIdRef = useRef<string | null>(null);
  const timersRef = useRef<number[]>([]);
  const { t, lang } = useT();

  useEffect(() => {
    setCurrent(notes[0] ?? null);
    setOpened(false);
    setShake(false);
    setBursting(false);
    setCorkOpen(false);
    setOpenMedia(false);
    lastIdRef.current = null;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, [memberName, notes]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pending = useMemo(() => notes.filter((note) => note.status !== "REJECTED"), [notes]);

  const onShake = () => {
    if (pending.length === 0) return;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setOpened(false);
    setBursting(false);
    setCorkOpen(false);
    setShake(false);
    setOpenMedia(false);
    timersRef.current.push(
      window.setTimeout(() => {
        setShake(true);
        let next = weightedPick(pending);
        if (pending.length > 1 && lastIdRef.current === next.id) {
          const pool = pending.filter((note) => note.id !== lastIdRef.current);
          if (pool.length > 0) {
            next = weightedPick(pool);
          }
        }
        setCurrent(next);
        lastIdRef.current = next.id;
        setBursting(true);
        setCorkOpen(true);
        timersRef.current.push(window.setTimeout(() => setShake(false), 700));
        timersRef.current.push(window.setTimeout(() => setCorkOpen(false), 1200));
        timersRef.current.push(
          window.setTimeout(() => {
            setBursting(false);
            setOpened(true);
          }, 4200)
        );
      }, 150)
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="gradient-panel rounded-xxl p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.bottle.todayEnergy}</p>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
              {memberName} {t.bottle.bottleOf}
            </h2>
          </div>
          <button
            onClick={onShake}
            className="relative z-40 rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
          >
            {t.bottle.shake}
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center">
          {(opened || bursting) && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => {
                setOpened(false);
                setBursting(false);
              }}
              aria-hidden="true"
            />
          )}
          <div
            className={`relative z-40 flex h-[420px] w-[300px] items-end justify-center cursor-pointer ${
              shake ? "shake-animate" : ""
            } ${corkOpen ? "bottle-open" : ""}`}
            onClick={onShake}
          >
            <div className="cork" />
            <div className="jar-neck" />
            <div className="jar">
              <div className="jar-stars">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className={`star star-${i + 1}`} />
                ))}
              </div>
            </div>
            <div className={`burst-layer ${bursting ? "burst-active" : ""}`} aria-hidden="true">
              <div className="burst-star" />
              <div className="burst-ring" />
            </div>
            <div
              className={`absolute left-1/2 top-1/2 w-[280px] -translate-x-1/2 -translate-y-1/2 letter-wrap ${
                opened ? "letter-open pointer-events-auto" : "pointer-events-none"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="letter-flap" />
              <button
                type="button"
                className="paper-note w-full text-left"
                onClick={() => opened && current?.mediaUrl && setOpenMedia(true)}
              >
                <div className="paper-content">
                  <div className="flex items-center justify-between text-[11px] text-ink/70">
                    <span>{t.bottle.paper}</span>
                    <span>{current?.eventDateLabel ?? ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span>{current?.title ?? t.bottle.shake}</span>
                    {current?.mediaType && mediaIcons[current.mediaType] && (
                      <span className="inline-flex items-center">{mediaIcons[current.mediaType]}</span>
                    )}
                  </div>
                  <div className="text-xs text-ink/70 max-h-12 overflow-hidden">
                    {current?.text ?? t.bottle.openHint}
                  </div>
                  {current?.senderName && (
                    <div className="text-[11px] text-ink/60 text-right">{t.common.from} {current.senderName}</div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
        <p className="mt-5 text-sm text-ink/70 text-center">
          {t.bottle.tip1}
          <br />
          {t.bottle.tip2}
        </p>
      </section>

      {mounted && openMedia && current?.mediaUrl &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpenMedia(false)}>
            <div className="max-h-[90vh] w-full max-w-3xl rounded-2xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between text-xs text-ink/70">
                <span>{current.title}</span>
                <button type="button" onClick={() => setOpenMedia(false)} className="text-ember">{t.common.close}</button>
              </div>
              {current.mediaType === "image" && (
                <img src={current.mediaUrl} alt={lang === "en" ? "Energy image" : "能量图片"} className="mt-3 max-h-[70vh] w-full rounded-lg object-contain" />
              )}
              {current.mediaType === "video" && (
                <video
                  src={current.mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="mt-3 max-h-[70vh] w-full rounded-lg"
                />
              )}
              {current.mediaType === "audio" && (
                <audio src={current.mediaUrl} controls className="mt-3 w-full" />
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
