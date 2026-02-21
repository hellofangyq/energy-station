import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  if (!token || !password) {
    return NextResponse.json({ error: "缺少字段" }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const now = new Date();
  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { gt: now }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "链接已失效" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
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
