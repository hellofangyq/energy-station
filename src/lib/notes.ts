import type { Note, Member, User } from "@prisma/client";
import type { NotePreview } from "@/lib/types";
import { formatDateOnly, formatDateTime } from "@/lib/format";

export function toNotePreview(note: Note & { member: Member; sender: User }, lang: "zh" | "en" = "zh"): NotePreview {
  const statusLabel =
    lang === "en"
      ? note.status === "PENDING"
        ? "Pending"
        : note.status === "REJECTED"
        ? "Rejected"
        : "Accepted"
      : note.status === "PENDING"
      ? "待接收"
      : note.status === "REJECTED"
      ? "已拒收"
      : "已接收";

  return {
    id: note.id,
    title: note.title,
    text: note.text,
    memberId: note.memberId,
    memberName: note.member.name,
    senderName: note.sender.name,
    createdAtLabel: formatDateTime(note.createdAt, lang),
    createdAtISO: note.createdAt.toISOString(),
    eventDateLabel: formatDateOnly(note.eventDate, lang),
    eventDateISO: note.eventDate.toISOString(),
    statusLabel,
    status: note.status,
    inboxRead: note.inboxRead,
    mediaType: note.type,
    mediaUrl: note.mediaUrl,
    mediaDuration: null
  };
}
