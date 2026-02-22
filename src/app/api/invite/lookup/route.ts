import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");
  if (!token) {
    return NextResponse.json({ error: "缺少邀请" }, { status: 400 });
  }

  const member = await prisma.member.findFirst({
    where: {
      inviteToken: token,
      linkedUserId: null,
      OR: [{ inviteExpiresAt: null }, { inviteExpiresAt: { gt: new Date() } }]
    },
    include: { user: true }
  });

  if (!member) {
    return NextResponse.json({ ok: true, member: null });
  }

  return NextResponse.json({
    ok: true,
    member: {
      id: member.id,
      name: member.name,
      ownerName: member.user.name
    }
  });
}
