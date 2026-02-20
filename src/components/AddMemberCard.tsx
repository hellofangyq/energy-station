"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";

const bottleOptions = [
  { value: "bottle", label: "能量瓶" },
  { value: "station", label: "能量站" },
  { value: "jar", label: "玻璃罐" },
  { value: "constellation", label: "星图" }
];

export default function AddMemberCard() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("正在添加...");
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          role: "CHILD",
          bottleStyle: formData.get("bottleStyle")
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "添加失败");
      }

      setStatus("添加成功");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "添加失败");
    }
  };

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="gradient-panel rounded-xxl border border-dashed border-ember/40 p-5 text-left text-sm text-ink/70"
        >
          + 添加新成员
        </button>
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="gradient-panel rounded-xxl border border-dashed border-ember/40 p-5 text-left text-sm text-ink/70"
        >
          + 导入成员
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".zip,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setStatus("正在导入...");
            try {
              let payload: any = null;
              if (file.name.toLowerCase().endsWith(".zip")) {
                const buffer = await file.arrayBuffer();
                const zip = await JSZip.loadAsync(buffer);
                const jsonEntry =
                  zip.file(/data\.json$/i)[0] ||
                  zip.file(/\.json$/i)[0];
                if (!jsonEntry) {
                  throw new Error("压缩包中未找到 data.json");
                }
                const text = await jsonEntry.async("text");
                payload = JSON.parse(text);
              } else {
                const text = await file.text();
                payload = JSON.parse(text);
              }
              const response = await fetch("/api/members/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
              if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "导入失败");
              }
              setStatus("导入成功");
              router.refresh();
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "导入失败");
            } finally {
              if (importRef.current) importRef.current.value = "";
            }
          }}
        />
        {status && <p className="text-xs text-ink/70">{status}</p>}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="gradient-panel rounded-xxl p-5 shadow-soft space-y-4">
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-ink/70">孩子姓名</label>
        <input
          name="name"
          required
          placeholder="例如：小宇"
          className="mt-2 w-full rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-ink/70">能量瓶形态</label>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {bottleOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm">
              <input type="radio" name="bottleStyle" value={option.value} defaultChecked={option.value === "bottle"} />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white shadow-glow">添加</button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink/60"
        >
          取消
        </button>
      </div>
      {status && <p className="text-xs text-ink/70">{status}</p>}
    </form>
  );
}
