import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const members = await prisma.member.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name ?? "");
  const role = String(body.role ?? "CHILD");
  const bottleStyle = String(body.bottleStyle ?? "bottle");

  if (!name) {
    return NextResponse.json({ error: "缺少姓名" }, { status: 400 });
  }

  const member = await prisma.member.create({
    data: {
      userId,
      name,
      role: role === "SELF" ? "SELF" : "CHILD",
      bottleStyle
    }
  });

  return NextResponse.json({ member });
}
