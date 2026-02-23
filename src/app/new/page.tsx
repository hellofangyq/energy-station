"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MemberTabs from "@/components/MemberTabs";
import { useActiveMember } from "@/components/useActiveMember";
import { useSessionUser } from "@/components/useSessionUser";
import { useT } from "@/components/LanguageProvider";
import { translateError } from "@/lib/error-map";
import { upload } from "@vercel/blob/client";

export default function NewEnergyPage() {
  const { t, lang } = useT();
  const [status, setStatus] = useState<string | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string; role: "SELF" | "CHILD" }[]>([]);
  const [selectedType, setSelectedType] = useState("text");
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberErrorCode, setMemberErrorCode] = useState<"UNAUTHORIZED" | "FAILED" | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    fetch("/api/members?scope=family")
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("UNAUTHORIZED");
          throw new Error("FAILED");
        }
        return res.json();
      })
      .then((data) => {
        if (active) setMembers(data.members ?? []);
      })
      .catch((err) => {
        if (active) {
          setMembers([]);
          const code = err instanceof Error ? err.message : "FAILED";
          setMemberErrorCode(code === "UNAUTHORIZED" ? "UNAUTHORIZED" : "FAILED");
          setMemberError(code === "UNAUTHORIZED" ? t.common.loginFirst : t.new.memberError);
        }
      })
      .finally(() => {
        if (active) setLoadingMembers(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [recordedUrl]);



  const currentMembers = useMemo(() => {
    if (members.length > 0) return members;
    return [];
  }, [members]);

  const { user } = useSessionUser();
  const displayMembers = useMemo(() => {
    if (user?.role === "MEMBER" && user.linkedMemberId) {
      return currentMembers.map((member) =>
        member.id === user.linkedMemberId ? { ...member, name: user.name } : member
      );
    }
    return currentMembers;
  }, [currentMembers, user]);
  const { activeId, setActiveId, activeMember } = useActiveMember(displayMembers);
  const needsLogin = !loadingMembers && memberErrorCode === "UNAUTHORIZED";

  const getMediaDuration = (file: File) => {
    return new Promise<number>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const isAudio = file.type.startsWith("audio/");
      const media = document.createElement(isAudio ? "audio" : "video");
      media.preload = "metadata";
      media.src = url;
      media.onloadedmetadata = () => {
        const duration = media.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      media.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(lang === "en" ? "Cannot read media duration" : "无法读取媒体时长"));
      };
    });
  };

  const validateFile = async () => {
    const file = fileRef.current?.files?.[0] ?? null;
    if (!file) {
      if (selectedType === "audio" && recordedBlob) {
        setFileError(null);
        return true;
      }
      setFileError(null);
      return selectedType === "text";
    }

    if (selectedType === "text") {
      setFileError(lang === "en" ? "Text type does not need media" : "文字类型不需要上传媒体");
      return false;
    }

    const match =
      (selectedType === "image" && file.type.startsWith("image/")) ||
      (selectedType === "audio" && file.type.startsWith("audio/")) ||
      (selectedType === "video" && file.type.startsWith("video/"));

    if (!match) {
      setFileError(lang === "en" ? "Media type does not match" : "媒体类型与选择的能量类型不匹配");
      return false;
    }

    if (selectedType === "audio" || selectedType === "video") {
      try {
        const duration = await getMediaDuration(file);
        const limit = selectedType === "audio" ? 60 : 15;
        if (duration > limit) {
          setFileError(
            selectedType === "audio"
              ? (lang === "en" ? "Audio must be under 60 seconds" : "语音时长不能超过 60 秒")
              : (lang === "en" ? "Video must be under 15 seconds" : "视频时长不能超过 15 秒")
          );
          return false;
        }
      } catch (error) {
        setFileError(lang === "en" ? "Cannot read media duration" : "无法读取媒体时长");
        return false;
      }
    }

    setFileError(null);
    return true;
  };

  const startRecording = async () => {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const duration = await getMediaDuration(new File([blob], "record.webm", { type: blob.type }));
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setRecordDuration(duration);
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);

      recordTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, 60000);
    } catch (error) {
      setRecordError(lang === "en" ? "Microphone permission denied" : "无法获取麦克风权限");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordDuration(null);
    setRecordError(null);
  };

  const uploadVideo = async (file: File) => {
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        contentType: file.type || "video/mp4",
        handleUploadUrl: "/api/blob/upload"
      });
      return { url: blob.url, mediaType: file.type || "video/mp4" };
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(t.common.loading);
    const formData = new FormData(event.currentTarget);
    const memberId = formData.get("memberId");
    const fileValid = await validateFile();
    const media = formData.get("media") as File | null;
    const title = String(formData.get("title") ?? "");
    const text = String(formData.get("text") ?? "");
    const eventDateRaw = String(formData.get("eventDate") ?? "");

    if (!memberId) {
      setStatus(lang === "en" ? "Please select a recipient" : "请选择接收对象");
      return;
    }

    if (selectedType !== "text" && (!media || media.size === 0) && !recordedBlob) {
      setStatus(lang === "en" ? "Please choose the correct media file" : "请选择对应的媒体文件");
      return;
    }

    if (!fileValid) {
      setStatus(lang === "en" ? "Invalid media file" : "媒体文件不符合要求");
      return;
    }

    if (selectedType === "text") {
      formData.delete("media");
    }

    if (selectedType === "audio" && recordedBlob && (!media || media.size === 0)) {
      if (recordDuration && recordDuration > 60) {
        setStatus(lang === "en" ? "Audio must be under 60 seconds" : "语音时长不能超过 60 秒");
        return;
      }
      const recordedFile = new File([recordedBlob], `record-${Date.now()}.webm`, { type: recordedBlob.type });
      formData.set("media", recordedFile);
    }

    try {
      if (selectedType === "video" && media && media.size > 0) {
        setStatus(lang === "en" ? "Uploading video..." : "正在上传视频...");
        const uploaded = await uploadVideo(media);
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId,
            type: "video",
            title,
            text,
            eventDate: eventDateRaw,
            mediaUrl: uploaded.url,
            mediaType: uploaded.mediaType,
            clientCompressed: "0"
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(translateError(data.error, lang) || (lang === "en" ? "Send failed" : "发送失败"));
        }

        setStatus(lang === "en" ? "Sent. The energy is in the bottle." : "发送成功，能量已进入瓶中。");
        formRef.current?.reset();
        resetRecording();
        return;
      }

      const response = await fetch("/api/notes", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(translateError(data.error, lang) || (lang === "en" ? "Send failed" : "发送失败"));
      }

      setStatus(lang === "en" ? "Sent. The energy is in the bottle." : "发送成功，能量已进入瓶中。");
      formRef.current?.reset();
      resetRecording();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : (lang === "en" ? "Send failed. Please try again." : "发送失败，请稍后再试。"));
    }
  };

  if (needsLogin) {
    return (
      <div className="gradient-panel rounded-xxl p-6 text-sm text-ink/70">
        {lang === "en" ? (
          <>
            Please <a className="text-ember" href="/login">{t.nav.login}</a> to write energy.
          </>
        ) : (
          <>
            请先 <a className="text-ember" href="/login">{t.nav.login}</a>，再写能量。
          </>
        )}
      </div>
    );
  }

  const typeOptions = [
    { value: "text", label: t.new.text },
    { value: "image", label: t.new.image },
    { value: "audio", label: t.new.audio },
    { value: "video", label: t.new.video }
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">{t.new.title}</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          {t.new.title}
        </h2>
        <p className="mt-2 text-sm text-ink/70">{t.new.subtitle}</p>
      </header>

      <form ref={formRef} onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 shadow-soft space-y-5">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">{t.new.sendTo}</label>
          {loadingMembers ? (
            <p className="mt-2 text-sm text-ink/60">{t.new.loadingMembers}</p>
          ) : memberError ? (
            <p className="mt-2 text-sm text-ember">{memberError}</p>
          ) : currentMembers.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">{t.new.noMembers}</p>
          ) : (
            <div className="mt-2 space-y-3">
              <MemberTabs members={displayMembers} activeId={activeId} onChange={setActiveId} />
              <input type="hidden" name="memberId" value={activeId} />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">{t.new.type}</label>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            {typeOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  defaultChecked={option.value === "text"}
                  onChange={() => {
                    setSelectedType(option.value);
                    void validateFile();
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">{t.new.titleLabel}</label>
          <input
            name="title"
            placeholder={t.new.titlePlaceholder}
            required
            className="mt-2 w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
          <textarea
            name="text"
            rows={4}
            placeholder={t.new.textPlaceholder}
            className="mt-2 w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">{t.new.dateLabel}</label>
          <input
            type="date"
            name="eventDate"
            defaultValue={today}
            className="mt-2 w-full max-w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm date-input"
            lang={lang}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">{t.new.mediaLabel}</label>
          <input
            ref={fileRef}
            type="file"
            name="media"
            className="mt-2 block w-full text-sm"
            onChange={() => void validateFile()}
          />
          {selectedType === "audio" && (
            <div className="mt-3 rounded-xl border border-white/70 bg-white/60 p-3 text-xs text-ink/70">
              <div className="flex flex-wrap items-center gap-2">
                {!recording ? (
                  <button
                    type="button"
                    className="rounded-full border border-ember/40 px-3 py-1 text-xs text-ember"
                    onClick={startRecording}
                  >
                    {t.new.recordStart}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-full bg-ember px-3 py-1 text-xs font-semibold text-white shadow-glow"
                    onClick={stopRecording}
                  >
                    {t.new.recordStop}
                  </button>
                )}
                {recordedBlob && (
                  <button
                    type="button"
                    className="rounded-full border border-ember/40 px-3 py-1 text-xs text-ember"
                    onClick={resetRecording}
                  >
                    {t.new.recordRetry}
                  </button>
                )}
                {recordDuration !== null && (
                  <span>{t.new.duration}：{Math.round(recordDuration)} 秒</span>
                )}
              </div>
              {recordedUrl && (
                <audio controls src={recordedUrl} className="mt-2 w-full" />
              )}
              {recordError && <p className="mt-2 text-xs text-ember">{recordError}</p>}
            </div>
          )}
          <p className="mt-2 text-xs text-ink/60">{t.new.mediaHint}</p>
          {fileError && <p className="mt-2 text-xs text-ember">{fileError}</p>}
        </div>

        <div className="flex items-center justify-between">
          <button className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
            {t.new.submit}
          </button>
          {status && <span className="text-xs text-ink/70">{status}</span>}
        </div>
      </form>

    </div>
  );
}
