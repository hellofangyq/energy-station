import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import AddMemberCard from "@/components/AddMemberCard";
import InviteMemberButton from "@/components/InviteMemberButton";
import { getServerDict, getServerLang } from "@/lib/i18n-server";

export default async function PeoplePage() {
  const userId = await getSessionUserId();
  const t = await getServerDict();
  const lang = await getServerLang();
  if (!userId) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        {lang === "en" ? (
          <>
            Please <a className="text-ember" href="/login">{t.nav.login}</a> to manage family members.
          </>
        ) : (
          <>
            请先 <a className="text-ember" href="/login">{t.nav.login}</a>，再管理家庭成员。
          </>
        )}
      </div>
    );
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  if (user?.role === "MEMBER") {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        {t.people.onlyOwner}
      </div>
    );
  }

  const members = await prisma.member.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.people.title}</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          {t.people.heading}
        </h2>
        <p className="mt-2 text-sm text-ink/70">{t.people.subtitle}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member) => (
          <div key={member.id} className="gradient-panel rounded-xxl p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-xs text-ink/60">
                  {member.role === "SELF" ? t.people.self : t.people.child} · {member.bottleStyle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <InviteMemberButton memberId={member.id} />
                <a
                  className="rounded-full border border-ember/40 px-3 py-1 text-xs text-ember"
                  href={`/people/${member.id}/edit`}
                >
                  {t.people.edit}
                </a>
            </div>
            </div>
            <div className="mt-4 text-xs text-ink/60">
              {t.people.bottleStyleText} {member.bottleStyle}
            </div>
          </div>
        ))}
        <AddMemberCard />
      </div>
    </div>
  );
}
