import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? "").toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "缺少字段" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
