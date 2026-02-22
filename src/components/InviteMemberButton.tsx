"use client";

import { useState } from "react";
import { useT } from "@/components/LanguageProvider";
import { translateError } from "@/lib/error-map";

export default function InviteMemberButton({ memberId }: { memberId: string }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const createInvite = async () => {
    setStatus(t.common.loading);
    try {
      const res = await fetch(`/api/members/${memberId}/invite`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(translateError(data.error, lang) || (lang === "en" ? "Failed to generate" : "生成失败"));
      setLink(data.url);
      setOpen(true);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : (lang === "en" ? "Failed to generate" : "生成失败"));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={createInvite}
        className="rounded-full border border-ember/40 px-3 py-1 text-xs text-ember"
      >
        {t.people.invite}
      </button>
      {status && <span className="text-[11px] text-ink/60">{status}</span>}
      {open && link ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t.people.inviteTitle}</h3>
              <button className="text-xs text-ember" onClick={() => setOpen(false)}>{t.common.close}</button>
            </div>
            <p className="mt-2 text-xs text-ink/60">{t.people.inviteTip}</p>
            <div className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs break-all">{link}</div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setStatus(t.people.copied);
                }}
              >
                {t.people.copy}
              </button>
              <button type="button" className="text-xs text-ink/60" onClick={() => setOpen(false)}>{t.common.confirm}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
