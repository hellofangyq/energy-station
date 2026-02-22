import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getFamilyContext } from "@/lib/family";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const context = await getFamilyContext(userId);
  if (!context || context.role !== "OWNER") {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  const { id } = await params;
  const member = await prisma.member.findFirst({
    where: { id, userId: context.ownerId }
  });
  if (!member) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  const notes = await prisma.note.findMany({
    where: { memberId: member.id },
    include: { sender: true, member: true },
    orderBy: { createdAt: "desc" }
  });

  const exported = {
    version: 1,
    exportedAt: new Date().toISOString(),
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      bottleStyle: member.bottleStyle
    },
    notesCount: notes.length,
    notes: notes.map((note) => ({
      id: note.id,
      memberId: note.memberId,
      memberName: note.member.name,
      senderName: note.sender.name,
      type: note.type,
      title: note.title,
      text: note.text,
      mediaUrl: note.mediaUrl,
      status: note.status,
      eventDate: note.eventDate.toISOString(),
      createdAt: note.createdAt.toISOString()
    }))
  };

  return NextResponse.json(exported);
}
