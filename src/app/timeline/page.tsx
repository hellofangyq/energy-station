"use client";

import { useEffect, useMemo, useState } from "react";
import EnergyCard from "@/components/EnergyCard";
import MemberTabs from "@/components/MemberTabs";
import { useActiveMember } from "@/components/useActiveMember";
import { toNotePreview } from "@/lib/notes";
import type { NotePreview } from "@/lib/types";

type Member = {
  id: string;
  name: string;
  role: "SELF" | "CHILD";
  bottleStyle: "bottle" | "station" | "jar" | "constellation";
  avatarUrl: string | null;
  createdAt: string;
  userId: string;
};

type NoteApi = {
  id: string;
  memberId: string;
  senderId: string;
  type: "text" | "image" | "audio" | "video";
  title: string;
  text?: string | null;
  mediaUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  inboxRead?: boolean;
  eventDate: string;
  createdAt: string;
  rejectedAt?: string | null;
  member: Member;
  sender: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    resetTokenHash?: string | null;
    resetTokenExpiresAt?: string | null;
    createdAt: string;
  };
};

export default function TimelinePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<NoteApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/members"), fetch("/api/notes")])
      .then(async ([membersRes, notesRes]) => {
        if (!membersRes.ok || !notesRes.ok) {
          if (membersRes.status === 401 || notesRes.status === 401) {
            throw new Error("请先登录");
          }
          throw new Error("加载失败");
        }
        const membersData = await membersRes.json();
        const notesData = await notesRes.json();
        if (!active) return;
        setMembers(membersData.members ?? []);
        setNotes(notesData.notes ?? []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const { activeId, setActiveId, activeMember } = useActiveMember(members);

  const previews = useMemo<NotePreview[]>(() => {
    if (!activeMember) return [];
    const selected = notes.filter((note) => note.memberId === activeMember.id);
    const filtered = selected.filter((note) => {
      const eventDate = new Date(note.eventDate);
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (eventDate < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);
        if (eventDate > end) return false;
      }
      return true;
    });
    const mapped = filtered.map((note) =>
      toNotePreview({
        ...note,
        createdAt: new Date(note.createdAt),
        eventDate: new Date(note.eventDate),
        rejectedAt: note.rejectedAt ? new Date(note.rejectedAt) : null,
        inboxRead: note.inboxRead ?? false,
        text: note.text ?? null,
        mediaUrl: note.mediaUrl ?? null,
        member: {
          ...note.member,
          avatarUrl: note.member.avatarUrl ?? null,
          createdAt: new Date(note.member.createdAt)
        },
        sender: {
          ...note.sender,
          resetTokenHash: note.sender.resetTokenHash ?? null,
          resetTokenExpiresAt: note.sender.resetTokenExpiresAt
            ? new Date(note.sender.resetTokenExpiresAt)
            : null,
          createdAt: new Date(note.sender.createdAt)
        }
      })
    );
    return mapped.sort((a, b) => {
      const eventDiff = new Date(b.eventDateISO).getTime() - new Date(a.eventDateISO).getTime();
      if (eventDiff !== 0) return eventDiff;
      return new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime();
    });
  }, [notes, activeMember, startDate, endDate]);

  const groupEntries = useMemo(() => {
    const map = new Map<string, NotePreview[]>();
    previews.forEach((note) => {
      const list = map.get(note.eventDateLabel);
      if (list) {
        list.push(note);
      } else {
        map.set(note.eventDateLabel, [note]);
      }
    });
    return Array.from(map.entries());
  }, [previews]);

  const [pendingDelete, setPendingDelete] = useState<NotePreview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = (note: NotePreview) => {
    setPendingDelete(note);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);

    const response = await fetch(`/api/notes/${pendingDelete.id}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      setDeleting(false);
      return;
    }

    setNotes((prev) => prev.filter((note) => note.id !== pendingDelete.id));
    setPendingDelete(null);
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        正在加载时间轴...
      </div>
    );
  }

  if (error) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        {error}
      </div>
    );
  }

  if (!activeMember) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        还没有成员，请先在家庭管理里添加。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">时间轴</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          能量记忆
        </h2>
        <p className="mt-2 text-sm text-ink/70">按照时间串起每一条闪光点。</p>
      </header>

      <MemberTabs members={members} activeId={activeId} onChange={setActiveId} />

      <div className="gradient-panel rounded-xxl p-4 text-xs text-ink/70">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span>开始日期</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>结束日期</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="button"
            className="rounded-full border border-ember/40 px-3 py-2 text-xs text-ember"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            清除筛选
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {groupEntries.length === 0 ? (
          <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
            这个成员还没有能量纸条。
          </div>
        ) : (
          groupEntries.map(([dateLabel, items]) => (
            <section key={dateLabel} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-ember/20" />
                <span className="rounded-full bg-white/70 px-4 py-1 text-xs text-ember">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-ember/20" />
              </div>
              {items.map((note) => (
                <EnergyCard key={note.id} note={note} onDelete={requestDelete} />
              ))}
            </section>
          ))
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="gradient-panel w-full max-w-md rounded-xxl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-leaf">确认删除</p>
            <h3 className="mt-2 text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
              删除这条能量纸条？
            </h3>
            <p className="mt-3 text-sm text-ink/70">
              “{pendingDelete.title}”
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-ember/40 px-4 py-2 text-xs text-ember"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white shadow-glow"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
