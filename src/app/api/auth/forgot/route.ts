import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mailer";
import crypto from "crypto";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? "").toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "缺少邮箱" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt
    }
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset?token=${token}`;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl
    });
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, resetToken: token });
  }

  return NextResponse.json({ ok: true });
}
