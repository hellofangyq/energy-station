import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "缺少通知" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { userId, id: { in: ids } },
    data: { read: true }
  });

  return NextResponse.json({ ok: true });
}
