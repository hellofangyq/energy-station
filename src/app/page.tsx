import Bottle from "@/components/Bottle";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { toNotePreview } from "@/lib/notes";
import MemberDashboard from "@/components/MemberDashboard";
import { toNotificationPreview } from "@/lib/notifications";
import LoginForm from "@/components/LoginForm";
import IntroCards from "@/components/IntroCards";
import { getFamilyContext } from "@/lib/family";
import { getServerDict, getServerLang } from "@/lib/i18n-server";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const t = await getServerDict();
  const lang = await getServerLang();
  if (!userId) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.home.welcomeBadge}</p>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
            {t.home.welcome}
          </h2>
        </header>
        <LoginForm />
        <IntroCards />
      </div>
    );
  }
  const context = await getFamilyContext(userId);
  if (!context) {
    return null;
  }

  const notes = await prisma.note.findMany({
    where:
      context.role === "MEMBER" && context.linkedMemberId
        ? { memberId: context.linkedMemberId }
        : { member: { userId: context.ownerId } },
    include: { member: true, sender: true },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  if (context.role === "MEMBER" && context.linkedMemberId) {
    notes.forEach((note) => {
      if (note.memberId === context.linkedMemberId) {
        note.member.name = context.userName;
      }
    });
  }

  const previews = notes.map((note) => toNotePreview(note, lang));
  const members = await prisma.member.findMany({
    where:
      context.role === "MEMBER" && context.linkedMemberId
        ? { id: context.linkedMemberId }
        : { userId: context.ownerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true }
  });

  if (context.role === "MEMBER" && context.linkedMemberId) {
    members.forEach((member) => {
      if (member.id === context.linkedMemberId) {
        member.name = context.userName;
      }
    });
  }
  const notifications = await prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  const noticePreviews = notifications.map((notice) => toNotificationPreview(notice, lang));

  return (
    <div className="space-y-8">
      <MemberDashboard members={members} notes={previews} notifications={noticePreviews} />
    </div>
  );
}
