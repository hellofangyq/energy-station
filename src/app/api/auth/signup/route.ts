import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { normalizeAnswer } from "@/lib/security";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? "").toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "");
  const securityQ1 = String(body.securityQ1 ?? "");
  const securityQ2 = String(body.securityQ2 ?? "");
  const securityA1 = String(body.securityA1 ?? "");
  const securityA2 = String(body.securityA2 ?? "");
  const inviteToken = String(body.inviteToken ?? "");

  if (!email || !password || !name || !securityQ1 || !securityQ2 || !securityA1 || !securityA2) {
    return NextResponse.json({ error: "缺少字段" }, { status: 400 });
  }

  if (securityQ1 === securityQ2) {
    return NextResponse.json({ error: "请选择两个不同的问题" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const securityA1Hash = await hashPassword(normalizeAnswer(securityA1));
  const securityA2Hash = await hashPassword(normalizeAnswer(securityA2));
  if (inviteToken) {
    const member = await prisma.member.findFirst({
      where: {
        inviteToken,
        linkedUserId: null,
        OR: [{ inviteExpiresAt: null }, { inviteExpiresAt: { gt: new Date() } }]
      }
    });
    if (!member) {
      return NextResponse.json({ error: "邀请已失效" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "MEMBER",
        linkedMemberId: member.id,
        securityQ1,
        securityQ2,
        securityA1Hash,
        securityA2Hash
      }
    });

    await prisma.member.update({
      where: { id: member.id },
      data: { linkedUserId: user.id, inviteToken: null, inviteExpiresAt: null }
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "OWNER",
      securityQ1,
      securityQ2,
      securityA1Hash,
      securityA2Hash,
      members: {
        create: {
          name,
          role: "SELF",
          bottleStyle: "bottle"
        }
      }
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      linkedMemberId: (await prisma.member.findFirst({
        where: { userId: user.id, role: "SELF" },
        select: { id: true }
      }))?.id ?? null
    }
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
