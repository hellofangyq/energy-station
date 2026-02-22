import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getFamilyContext } from "@/lib/family";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (member.linkedUserId) {
    return NextResponse.json({ error: "该成员已完成绑定" }, { status: 400 });
  }

  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.member.update({
    where: { id: member.id },
    data: {
      inviteToken: token,
      inviteExpiresAt: expiresAt
    }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const url = `${baseUrl}/invite/${token}`;

  return NextResponse.json({ ok: true, url, expiresAt: expiresAt.toISOString() });
}
