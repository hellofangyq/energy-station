import Bottle from "@/components/Bottle";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { toNotePreview } from "@/lib/notes";
import MemberDashboard from "@/components/MemberDashboard";
import { toNotificationPreview } from "@/lib/notifications";

export default async function HomePage() {
  const userId = await getSessionUserId();
  if (!userId) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        请先 <a className="text-ember" href="/login">登录</a>，再查看能量瓶。
      </div>
    );
  }

  const notes = await prisma.note.findMany({
    where: { member: { userId } },
    include: { member: true, sender: true },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  const previews = notes.map(toNotePreview);
  const members = await prisma.member.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true }
  });
  const notifications = await prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  const noticePreviews = notifications.map(toNotificationPreview);

  return (
    <div className="space-y-8">
      <MemberDashboard members={members} notes={previews} notifications={noticePreviews} />
    </div>
  );
}
