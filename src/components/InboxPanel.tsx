"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotePreview } from "@/lib/types";
import type { NotificationPreview } from "@/lib/notifications";
import { useSessionUser } from "@/components/useSessionUser";
import { useT } from "@/components/LanguageProvider";

type Props = {
  todayNotes: NotePreview[];
  notifications: NotificationPreview[];
};

export default function InboxPanel({ todayNotes, notifications }: Props) {
  const { t, lang } = useT();
  const { user } = useSessionUser();
  const [items, setItems] = useState<NotePreview[]>(todayNotes);
  const [selected, setSelected] = useState<NotePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const hasItems = items.length > 0;
  const unreadCount = items.length;

  const groupedNotifications = useMemo(() => notifications.filter((n) => !n.read), [notifications]);

  useEffect(() => {
    setItems(todayNotes);
    setSelected(null);
  }, [todayNotes]);

  const openNote = (note: NotePreview) => {
    setSelected(note);
    setItems((prev) => prev.filter((item) => item.id !== note.id));
    void markRead([note.id]);
    void acceptNote(note.id);
  };

  const acceptNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" })
    });
  };

  const clearItems = () => {
    const noteIds = items.map((item) => item.id);
    if (selected && !noteIds.includes(selected.id)) {
      noteIds.push(selected.id);
    }
    const noticeIds = groupedNotifications.map((notice) => notice.id);
    void acceptNotes(noteIds);
    void markRead(noteIds);
    void markNotificationsRead(noticeIds);
    setItems([]);
    setSelected(null);
  };

  const acceptNotes = async (ids: string[]) => {
    if (ids.length === 0) return;
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACCEPTED" })
        })
      )
    );
  };

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    await fetch("/api/notes/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
  };

  const markNotificationsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
  };

  const rejectNote = async (note: NotePreview) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" })
      });
      if (!response.ok) return;

      setItems((prev) => prev.filter((item) => item.id !== note.id));
      setSelected((prev) => {
        if (!prev || prev.id !== note.id) return prev;
        return null;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <details
        className="relative z-30"
        open={open}
        onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="inbox-button list-none">
          <span className="inbox-envelope" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.2em] text-ember">{t.inbox.title}</span>
          {unreadCount > 0 && <span className="inbox-badge">{unreadCount}</span>}
        </summary>
        <div className="inbox-panel" onClick={(event) => event.stopPropagation()}>
          <div className="inbox-section">
            <div className="inbox-row">
              <div className="inbox-title">{t.inbox.today}</div>
            {(hasItems || groupedNotifications.length > 0 || selected) && (
              <button type="button" className="inbox-clear" onClick={clearItems}>
                {t.inbox.clear}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-ink/60">{t.inbox.empty}</p>
          ) : (
            <div className="space-y-3">
              {items.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className="inbox-item"
                  onClick={() => openNote(note)}
                >
                  <div className="flex items-center justify-between text-xs text-ink/60">
                    <span>{user?.role === "MEMBER" ? user.name : note.memberName}</span>
                    <span>{note.createdAtLabel}</span>
                  </div>
                  <div className="mt-2 text-sm text-ink/80">{note.title}</div>
                  {note.text && <div className="mt-1 text-xs text-ink/60 line-clamp-2">{note.text}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="inbox-section">
            <div className="inbox-title">{t.inbox.current}</div>
            <div className="rounded-2xl bg-white/80 px-4 py-4 text-sm text-ink/80">
              <div className="flex items-center justify-between text-xs text-ink/60">
                <span>{user?.role === "MEMBER" ? user.name : selected.memberName}</span>
                <span>{selected.createdAtLabel}</span>
              </div>
              <div className="mt-2 text-base font-semibold text-ink">{selected.title}</div>
              {selected.text && <p className="mt-2 text-sm text-ink/80">{selected.text}</p>}

              {selected.mediaUrl && selected.mediaType === "image" && (
                <img
                  src={selected.mediaUrl}
                  alt={lang === "en" ? "Energy image" : "能量图片"}
                  className="mt-3 h-40 w-full rounded-xl object-cover"
                />
              )}
              {selected.mediaUrl && selected.mediaType === "video" && (
                <video
                  src={selected.mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="mt-3 w-full rounded-xl"
                />
              )}
              {selected.mediaUrl && selected.mediaType === "audio" && (
                <audio controls src={selected.mediaUrl} className="mt-3 w-full" />
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                <span>{t.common.from} {selected.senderName}</span>
                <span>
                  {lang === "en" ? "Status" : "状态"}{" "}
                  {selected.status === "ACCEPTED"
                    ? t.status.accepted
                    : selected.status === "REJECTED"
                    ? t.status.rejected
                    : t.status.pending}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                {selected.status !== "REJECTED" && (
                  <button
                    type="button"
                    className="rounded-full border border-ember/50 px-4 py-2 text-xs font-semibold text-ember"
                    onClick={() => rejectNote(selected)}
                    disabled={busy}
                  >
                    {t.inbox.rejectAction}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {groupedNotifications.length > 0 && (
          <div className="inbox-section">
            <div className="inbox-title">{t.inbox.rejected}</div>
            <div className="space-y-3">
              {groupedNotifications.map((notice) => (
                <div key={notice.id} className="rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-ink/60">
                    <span>{notice.title}</span>
                    <span>{notice.createdAtLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink/80">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </details>
    </>
  );
}
