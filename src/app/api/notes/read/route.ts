import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getFamilyContext } from "@/lib/family";

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const context = await getFamilyContext(userId);
  if (!context) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "缺少纸条" }, { status: 400 });
  }

  const ownedNotes = await prisma.note.findMany({
    where:
      context.role === "MEMBER" && context.linkedMemberId
        ? { id: { in: ids }, memberId: context.linkedMemberId }
        : { id: { in: ids }, member: { userId: context.ownerId } },
    select: { id: true }
  });

  if (ownedNotes.length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.note.updateMany({
    where: { id: { in: ownedNotes.map((note) => note.id) } },
    data: { inboxRead: true }
  });

  return NextResponse.json({ ok: true });
}
