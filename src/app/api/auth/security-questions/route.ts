import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "缺少邮箱" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { securityQ1: true, securityQ2: true }
  });

  if (!user || !user.securityQ1 || !user.securityQ2) {
    return NextResponse.json({ ok: true, questions: [] });
  }

  return NextResponse.json({
    ok: true,
    questions: [user.securityQ1, user.securityQ2]
  });
}
