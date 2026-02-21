import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? "").toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "");

  if (!email || !password || !name) {
    return NextResponse.json({ error: "缺少字段" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      members: {
        create: {
          name,
          role: "SELF",
          bottleStyle: "bottle"
        }
      }
    }
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
