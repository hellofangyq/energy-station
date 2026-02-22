import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { normalizeAnswer } from "@/lib/security";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").toLowerCase();
  const answer1 = String(body.answer1 ?? "");
  const answer2 = String(body.answer2 ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (!email || !answer1 || !answer2 || !newPassword) {
    return NextResponse.json({ error: "缺少字段" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      securityA1Hash: true,
      securityA2Hash: true
    }
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  if (!user.securityA1Hash || !user.securityA2Hash) {
    return NextResponse.json({ error: "该账号未设置安全问题" }, { status: 400 });
  }

  const match1 = await verifyPassword(normalizeAnswer(answer1), user.securityA1Hash);
  const match2 = await verifyPassword(normalizeAnswer(answer2), user.securityA2Hash);
  if (!match1 || !match2) {
    return NextResponse.json({ error: "回答不正确" }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null
    }
  });

  return NextResponse.json({ ok: true });
}
