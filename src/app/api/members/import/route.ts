import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

type ImportPayload = {
  version?: number;
  member?: {
    name?: string;
    role?: "SELF" | "CHILD";
    bottleStyle?: "bottle" | "station" | "jar" | "constellation";
  };
  notes?: Array<{
    type?: "text" | "image" | "audio" | "video";
    title?: string;
    text?: string | null;
    mediaUrl?: string | null;
    status?: "PENDING" | "ACCEPTED" | "REJECTED";
    eventDate?: string;
    createdAt?: string;
  }>;
};

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await req.json()) as ImportPayload;
  const memberName = String(body.member?.name ?? "").trim();
  if (!memberName) {
    return NextResponse.json({ error: "缺少成员姓名" }, { status: 400 });
  }

  const member = await prisma.member.create({
    data: {
      userId,
      name: memberName,
      role: body.member?.role === "SELF" ? "SELF" : "CHILD",
      bottleStyle: body.member?.bottleStyle ?? "bottle"
    }
  });

  const notes = Array.isArray(body.notes) ? body.notes : [];
  const noteData = notes
    .filter((note) => String(note.title ?? "").trim())
    .map((note) => {
      const eventDate = note.eventDate ? new Date(note.eventDate) : new Date();
      const createdAt = note.createdAt ? new Date(note.createdAt) : new Date();
      return {
        memberId: member.id,
        senderId: userId,
        type: note.type ?? "text",
        title: String(note.title ?? "").trim() || "能量记录",
        text: note.text ?? null,
        mediaUrl: note.mediaUrl ?? null,
        status: note.status ?? "ACCEPTED",
        eventDate,
        createdAt,
        inboxRead: true
      };
    });

  if (noteData.length > 0) {
    await prisma.note.createMany({
      data: noteData
    });
  }

  return NextResponse.json({ ok: true, memberId: member.id });
}
