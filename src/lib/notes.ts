import type { Note, Member, User } from "@prisma/client";
import type { NotePreview } from "@/lib/types";
import { formatDateOnly, formatDateTime } from "@/lib/format";

export function toNotePreview(note: Note & { member: Member; sender: User }): NotePreview {
  const statusLabel =
    note.status === "PENDING" ? "待接收" : note.status === "REJECTED" ? "已拒收" : "已接收";

  return {
    id: note.id,
    title: note.title,
    text: note.text,
    memberId: note.memberId,
    memberName: note.member.name,
    senderName: note.sender.name,
    createdAtLabel: formatDateTime(note.createdAt),
    createdAtISO: note.createdAt.toISOString(),
    eventDateLabel: formatDateOnly(note.eventDate),
    eventDateISO: note.eventDate.toISOString(),
    statusLabel,
    inboxRead: note.inboxRead,
    mediaType: note.type,
    mediaUrl: note.mediaUrl,
    mediaDuration: null
  };
}
