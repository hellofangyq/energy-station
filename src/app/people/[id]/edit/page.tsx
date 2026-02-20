"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import JSZip from "jszip";

type Member = {
  id: string;
  name: string;
  role: "SELF" | "CHILD";
  bottleStyle: "bottle" | "station" | "jar" | "constellation";
};

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memberId = params?.id ?? "";
  const [member, setMember] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!memberId) return;
    fetch(`/api/members/${memberId}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("请先登录");
          throw new Error("加载失败");
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setMember(data.member ?? null);
        setName(data.member?.name ?? "");
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [memberId]);

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberId) return;
    if (!name.trim()) {
      setStatus("姓名不能为空");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "保存失败");
      }

      setStatus("保存成功");
      router.push("/people");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!memberId || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "删除失败");
      }
      router.push("/people");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const exportMember = async () => {
    if (!memberId || exporting) return;
    setExporting(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/members/${memberId}/export`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "导出失败");
      }
      const data = await response.json();

      const fileSafeName = (data.member?.name || "member").replace(/\s+/g, "-");
      const zip = new JSZip();
      const folder = zip.folder(fileSafeName) ?? zip;
      const mediaFolder = folder.folder("media");

      const notes = Array.isArray(data.notes) ? data.notes : [];
      const notesWithLocal = await Promise.all(
        notes.map(async (note: any) => {
          const mediaUrl = String(note.mediaUrl ?? "");
          if (!mediaUrl || !mediaUrl.startsWith("/uploads/")) {
            return { ...note, localMediaPath: "" };
          }
          try {
            const response = await fetch(mediaUrl);
            if (!response.ok) throw new Error("media fetch failed");
            const blob = await response.blob();
            const filename = mediaUrl.split("/").pop() || "media";
            mediaFolder?.file(filename, blob);
            return { ...note, localMediaPath: `media/${filename}` };
          } catch {
            return { ...note, localMediaPath: "" };
          }
        })
      );

      const exportPayload = {
        ...data,
        notes: notesWithLocal.map(({ localMediaPath, ...rest }: any) => rest)
      };

      const reportHtml = buildReportHtml({
        ...data,
        notes: notesWithLocal
      });

      folder.file("data.json", JSON.stringify(exportPayload, null, 2));
      folder.file("report.html", reportHtml);

      const blob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(blob);
      const zipLink = document.createElement("a");
      zipLink.href = zipUrl;
      zipLink.download = `${fileSafeName}-export.zip`;
      zipLink.click();
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const buildReportHtml = (data: any) => {
    const member = data.member ?? {};
    const notes = Array.isArray(data.notes) ? data.notes : [];
    const notesCount = Number(data.notesCount ?? notes.length ?? 0);
    const noteBlocks = notes
      .map((note: any) => {
        const title = escapeHtml(String(note.title ?? ""));
        const text = escapeHtml(String(note.text ?? ""));
        const createdAt = escapeHtml(String(note.createdAt ?? ""));
        const eventDate = escapeHtml(String(note.eventDate ?? ""));
        const mediaUrl = String(note.mediaUrl ?? "");
        const mediaType = String(note.mediaType ?? "text");
        const localPath = String(note.localMediaPath ?? "");
        const mediaLine = localPath
          ? mediaType === "image"
            ? `<img src="${escapeHtml(localPath)}" alt="能量图片" />`
            : mediaType === "video"
              ? `<video src="${escapeHtml(localPath)}" controls></video>`
              : mediaType === "audio"
                ? `<audio src="${escapeHtml(localPath)}" controls></audio>`
                : ""
          : mediaUrl
            ? mediaUrl.startsWith("http")
              ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noreferrer">媒体链接</a>`
              : `<span class="muted">媒体地址：${escapeHtml(mediaUrl)}</span>`
            : "";

        return `
          <div class="card">
            <div class="meta">${escapeHtml(note.memberName ?? "")} · ${createdAt}</div>
            <h3>${title}</h3>
            ${text ? `<p>${text}</p>` : ""}
            <div class="meta">事件日期：${eventDate}</div>
            ${mediaType !== "text" && mediaLine ? `<div class="media">${mediaLine}</div>` : ""}
          </div>
        `;
      })
      .join("");

    return `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(member.name ?? "能量成员")} · 能量记忆</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f5f3ef; color: #1b1b1b; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 40px 20px 60px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    .sub { color: #6f5a43; margin-bottom: 24px; }
    .card { background: #fff; border-radius: 16px; padding: 18px 20px; margin-bottom: 16px; box-shadow: 0 12px 24px rgba(55, 50, 40, 0.1); }
    .meta { font-size: 12px; color: #7b6b5a; margin-bottom: 6px; }
    .muted { color: #8c7a67; font-size: 12px; }
    .media img, .media video { width: 100%; max-height: 320px; object-fit: cover; border-radius: 12px; margin-top: 8px; }
    .media audio { width: 100%; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(member.name ?? "能量成员")} · 能量记忆</h1>
    <div class="sub">导出时间：${escapeHtml(data.exportedAt ?? "")}</div>
    <div class="sub">成员 ID：${escapeHtml(member.id ?? "")} · 记录数：${notesCount}</div>
    ${noteBlocks || `<div class="muted">暂无能量记录（请确认导出的成员是否正确）。</div>`}
    <div class="muted" style="margin-top: 32px;">提示：若媒体未打包成功，将显示原始地址链接。</div>
  </div>
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        正在加载成员信息...
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        {error ?? "成员不存在"}
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">编辑成员</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          修改姓名
        </h2>
      </header>

      <form onSubmit={onSave} className="gradient-panel rounded-xxl p-6 shadow-soft space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">姓名</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
            placeholder="输入成员姓名"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-full border border-ember/40 px-4 py-2 text-xs text-ember"
            onClick={() => router.back()}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="submit"
            className="rounded-full bg-ember px-5 py-2 text-xs font-semibold text-white shadow-glow"
            disabled={saving}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {status && <p className="text-xs text-ink/70">{status}</p>}
      </form>

      <div className="gradient-panel rounded-xxl p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">导出与删除</p>
        <h3 className="mt-2 text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          成员数据
        </h3>
        <p className="mt-3 text-sm text-ink/70">
          导出后会生成一个 zip，内含 JSON 数据文件与离线可打开的 HTML 报告。
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-ember/50 px-4 py-2 text-xs font-semibold text-ember"
            onClick={exportMember}
            disabled={exporting}
          >
            {exporting ? "导出中..." : "导出成员"}
          </button>
          <button
            type="button"
            className="rounded-full border border-ember/40 px-4 py-2 text-xs text-ember"
            onClick={() => setConfirmDelete(true)}
          >
            删除该成员
          </button>
        </div>
        <p className="mt-3 text-xs text-ink/60">
          删除后，该成员的所有能量记忆将不可恢复。
        </p>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="gradient-panel w-full max-w-md rounded-xxl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-leaf">确认删除</p>
            <h3 className="mt-2 text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
              确定删除该成员？
            </h3>
            <p className="mt-3 text-sm text-ink/70">
              删除后该成员的所有能量记忆将不可恢复。
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-ember/40 px-4 py-2 text-xs text-ember"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white shadow-glow"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
