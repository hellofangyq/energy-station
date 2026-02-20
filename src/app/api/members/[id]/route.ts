import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const member = await prisma.member.findFirst({
    where: { id, userId }
  });

  if (!member) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  return NextResponse.json({ member });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
  }

  const member = await prisma.member.findFirst({
    where: { id, userId }
  });
  if (!member) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  const updated = await prisma.member.update({
    where: { id },
    data: { name }
  });

  return NextResponse.json({ member: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const member = await prisma.member.findFirst({
    where: { id, userId }
  });
  if (!member) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  await prisma.note.deleteMany({
    where: { memberId: member.id }
  });

  await prisma.notification.deleteMany({
    where: { memberId: member.id }
  });

  await prisma.member.delete({
    where: { id: member.id }
  });

  return NextResponse.json({ ok: true });
}
