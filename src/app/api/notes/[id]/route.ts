import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { sendRejectionEmail } from "@/lib/mailer";
import { getFamilyContext } from "@/lib/family";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const context = await getFamilyContext(userId);
  if (!context) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const status = String(body.status ?? "");
  if (!status) {
    return NextResponse.json({ error: "缺少状态" }, { status: 400 });
  }

  const existing = await prisma.note.findUnique({
    where: { id },
    include: { member: true, sender: true }
  });

  const canAccess =
    existing &&
    (context.role === "OWNER"
      ? existing.member.userId === context.ownerId
      : existing.member.linkedUserId === userId);
  if (!canAccess) {
    return NextResponse.json({ error: "无权操作该纸条" }, { status: 403 });
  }

  if (status === "REJECTED") {
    await prisma.notification.create({
      data: {
        userId: existing.senderId,
        memberId: existing.memberId,
        title: "能量纸条被拒收",
        content: `“${existing.title}”被 ${existing.member.name} 拒收。`
      }
    });

    await sendRejectionEmail({
      to: existing.sender.email,
      senderName: existing.sender.name,
      memberName: existing.member.name,
      noteTitle: existing.title
    });
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  const note = await prisma.note.update({
    where: { id },
    data: {
      status: "ACCEPTED",
      rejectedAt: null
    }
  });

  return NextResponse.json({ note });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const context = await getFamilyContext(userId);
  if (!context) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.note.findUnique({
    where: { id },
    include: { member: true }
  });

  const canAccess =
    existing &&
    (context.role === "OWNER"
      ? existing.member.userId === context.ownerId
      : existing.member.linkedUserId === userId);
  if (!canAccess) {
    return NextResponse.json({ error: "无权操作该纸条" }, { status: 403 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
