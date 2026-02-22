import { prisma } from "@/lib/db";

export type FamilyContext = {
  role: "OWNER" | "MEMBER";
  ownerId: string;
  linkedMemberId: string | null;
  userName: string;
};

export async function getFamilyContext(userId: string): Promise<FamilyContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, linkedMemberId: true, name: true }
  });

  if (!user) return null;

  if (user.role === "OWNER") {
    return { role: "OWNER", ownerId: userId, linkedMemberId: user.linkedMemberId ?? null, userName: user.name };
  }

  if (!user.linkedMemberId) {
    return { role: "MEMBER", ownerId: userId, linkedMemberId: null, userName: user.name };
  }

  const member = await prisma.member.findUnique({
    where: { id: user.linkedMemberId },
    select: { userId: true }
  });

  return {
    role: "MEMBER",
    ownerId: member?.userId ?? userId,
    linkedMemberId: user.linkedMemberId,
    userName: user.name
  };
}
