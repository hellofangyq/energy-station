"use client";

import { useMemo } from "react";
import Bottle from "@/components/Bottle";
import MemberTabs from "@/components/MemberTabs";
import { useActiveMember } from "@/components/useActiveMember";
import InboxPanel from "@/components/InboxPanel";
import type { NotePreview } from "@/lib/types";
import type { NotificationPreview } from "@/lib/notifications";

type Member = {
  id: string;
  name: string;
  role: "SELF" | "CHILD";
};

type Props = {
  members: Member[];
  notes: NotePreview[];
  notifications: NotificationPreview[];
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MemberDashboard({ members, notes, notifications }: Props) {
  const { activeId, setActiveId, activeMember } = useActiveMember(members);

  const memberNotes = useMemo(() => {
    if (!activeMember) return [];
    return notes.filter((note) => note.memberId === activeMember.id);
  }, [notes, activeMember]);

  const todayNotes = useMemo(() => {
    const today = new Date();
    return memberNotes.filter((note) => {
      if (note.inboxRead) return false;
      const created = new Date(note.createdAtISO);
      return isSameDay(created, today);
    });
  }, [memberNotes]);

  const memberNotifications = useMemo(() => {
    if (!activeMember) return [];
    return notifications.filter((notice) => notice.memberId === activeMember.id && !notice.read);
  }, [notifications, activeMember]);

  if (!activeMember) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        还没有成员，请先在家庭管理里添加。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MemberTabs members={members} activeId={activeId} onChange={setActiveId} />
        <InboxPanel todayNotes={todayNotes} notifications={memberNotifications} />
      </div>
      <Bottle notes={memberNotes} memberName={activeMember.name} />
    </div>
  );
}
