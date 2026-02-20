"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NotePreview } from "@/lib/types";

export default function EnergyCard({ note, onDelete }: { note: NotePreview; onDelete?: (note: NotePreview) => void }) {
  const [openMedia, setOpenMedia] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="gradient-panel rounded-xxl p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-leaf">{note.memberName}</p>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
            {note.title}
          </h3>
        </div>
        <span className="text-xs text-ember">{note.createdAtLabel}</span>
      </div>
      {note.text && <p className="mt-3 text-sm leading-relaxed text-ink/80">{note.text}</p>}
      {note.mediaUrl && note.mediaType === "image" && (
        <button
          type="button"
          onClick={() => setOpenMedia(true)}
          className="mt-4 w-full overflow-hidden rounded-xl bg-white/60 p-2 text-left"
        >
          <img src={note.mediaUrl} alt="能量图片" className="h-40 w-full rounded-lg object-cover" />
          <span className="mt-2 block text-xs text-ink/70">点击放大</span>
        </button>
      )}
      {note.mediaUrl && note.mediaType === "video" && (
        <div className="mt-4 rounded-xl bg-white/60 p-3 text-xs text-ink/70">
          <button type="button" onClick={() => setOpenMedia(true)} className="text-ember">
            播放视频
          </button>
        </div>
      )}
      {note.mediaUrl && note.mediaType === "audio" && (
        <div className="mt-4 rounded-xl bg-white/60 p-3 text-xs text-ink/70">
          <audio controls src={note.mediaUrl} className="w-full" />
        </div>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-ink/60">
        <span>来自 {note.senderName}</span>
        <span>· 状态 {note.statusLabel}</span>
        <span>· 日期 {note.eventDateLabel}</span>
        {onDelete && (
          <button
            type="button"
            className="ml-auto rounded-full border border-ember/40 px-3 py-1 text-xs text-ember"
            onClick={() => onDelete(note)}
          >
            删除
          </button>
        )}
      </div>

      {mounted && openMedia && note.mediaUrl &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpenMedia(false)}>
            <div className="max-h-[90vh] w-full max-w-3xl rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-xs text-ink/70">
                <span>{note.title}</span>
                <button type="button" onClick={() => setOpenMedia(false)} className="text-ember">关闭</button>
              </div>
              {note.mediaType === "image" && (
                <img src={note.mediaUrl} alt="能量图片" className="mt-3 max-h-[70vh] w-full rounded-lg object-contain" />
              )}
              {note.mediaType === "video" && (
                <video src={note.mediaUrl} controls className="mt-3 max-h-[70vh] w-full rounded-lg" />
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
