export type NotePreview = {
  id: string;
  title: string;
  text?: string | null;
  memberId: string;
  memberName: string;
  senderName: string;
  createdAtLabel: string;
  createdAtISO: string;
  eventDateLabel: string;
  eventDateISO: string;
  statusLabel: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  inboxRead: boolean;
  mediaType: "text" | "image" | "audio" | "video";
  mediaUrl?: string | null;
  mediaDuration?: number | null;
};

export type MemberOption = {
  id: string;
  name: string;
  role: "SELF" | "CHILD";
  bottleStyle: "bottle" | "station" | "jar" | "constellation";
};
