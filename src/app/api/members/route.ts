import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getFamilyContext } from "@/lib/family";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const context = await getFamilyContext(userId);
  if (!context) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  let where: { userId?: string; id?: string } = {};
  if (scope === "family") {
    where = { userId: context.ownerId };
  } else if (context.role === "MEMBER" && context.linkedMemberId) {
    where = { id: context.linkedMemberId };
  } else {
    where = { userId: context.ownerId };
  }

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "asc" }
  });

  if (context.role === "MEMBER" && context.linkedMemberId) {
    members.forEach((member) => {
      if (member.id === context.linkedMemberId) {
        member.name = context.userName;
      }
    });
  }

  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const context = await getFamilyContext(userId);
  if (!context || context.role !== "OWNER") {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name ?? "");
  const role = String(body.role ?? "CHILD");
  const bottleStyleRaw = String(body.bottleStyle ?? "bottle");
  const bottleStyle =
    bottleStyleRaw === "station" || bottleStyleRaw === "jar" || bottleStyleRaw === "constellation"
      ? bottleStyleRaw
      : "bottle";

  if (!name) {
    return NextResponse.json({ error: "缺少姓名" }, { status: 400 });
  }

  const member = await prisma.member.create({
    data: {
      userId: context.ownerId,
      name,
      role: role === "SELF" ? "SELF" : "CHILD",
      bottleStyle
    }
  });

  return NextResponse.json({ member });
}
