"use client";

type Member = {
  id: string;
  name: string;
};

type Props = {
  members: Member[];
  activeId: string;
  onChange: (id: string) => void;
};

export default function MemberTabs({ members, activeId, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          onClick={() => onChange(member.id)}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            activeId === member.id
              ? "bg-ember text-white shadow-glow"
              : "bg-white/70 text-ink/70 hover:text-ember"
          }`}
        >
          {member.name}
        </button>
      ))}
    </div>
  );
}
