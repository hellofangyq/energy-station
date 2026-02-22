"use client";

import { useMemo } from "react";
import Bottle from "@/components/Bottle";
import MemberTabs from "@/components/MemberTabs";
import { useActiveMember } from "@/components/useActiveMember";
import InboxPanel from "@/components/InboxPanel";
import { useSessionUser } from "@/components/useSessionUser";
import type { NotePreview } from "@/lib/types";
import type { NotificationPreview } from "@/lib/notifications";
import { useT } from "@/components/LanguageProvider";

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
  const { t } = useT();
  const { user } = useSessionUser();
  const displayMembers = useMemo(() => {
    if (user?.role === "MEMBER" && user.linkedMemberId) {
      return members.map((member) =>
        member.id === user.linkedMemberId ? { ...member, name: user.name } : member
      );
    }
    return members;
  }, [members, user]);
  const { activeId, setActiveId, activeMember } = useActiveMember(displayMembers);

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
        {t.timeline.emptyMembers}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MemberTabs members={displayMembers} activeId={activeId} onChange={setActiveId} />
        <InboxPanel todayNotes={todayNotes} notifications={memberNotifications} />
      </div>
      <Bottle notes={memberNotes} memberName={activeMember.name} />
    </div>
  );
}
