import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import AddMemberCard from "@/components/AddMemberCard";

export default async function PeoplePage() {
  const userId = await getSessionUserId();
  if (!userId) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        请先 <a className="text-ember" href="/login">登录</a>，再管理家庭成员。
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
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">家庭管理</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          能量成员
        </h2>
        <p className="mt-2 text-sm text-ink/70">添加孩子，设置每个人的能量瓶形态与偏好。</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member) => (
          <div key={member.id} className="gradient-panel rounded-xxl p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-xs text-ink/60">
                  {member.role === "SELF" ? "自己" : "孩子"} · {member.bottleStyle}
                </p>
              </div>
              <a
                className="rounded-full border border-ember/40 px-3 py-1 text-xs text-ember"
                href={`/people/${member.id}/edit`}
              >
                编辑
              </a>
            </div>
            <div className="mt-4 text-xs text-ink/60">
              能量瓶形态：{member.bottleStyle}
            </div>
          </div>
        ))}
        <AddMemberCard />
      </div>
    </div>
  );
}
