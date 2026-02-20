"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MemberTabs from "@/components/MemberTabs";
import { useActiveMember } from "@/components/useActiveMember";

const typeOptions = [
  { value: "text", label: "文字" },
  { value: "image", label: "图片" },
  { value: "audio", label: "语音 <1分钟" },
  { value: "video", label: "视频 <15秒" }
];

export default function NewEnergyPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string; role: "SELF" | "CHILD" }[]>([]);
  const [selectedType, setSelectedType] = useState("text");
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    fetch("/api/members")
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("请先登录");
          throw new Error("加载失败");
        }
        return res.json();
      })
      .then((data) => {
        if (active) setMembers(data.members ?? []);
      })
      .catch(() => {
        if (active) {
          setMembers([]);
          setMemberError("无法加载成员，请先登录或稍后再试。");
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

  const { activeId, setActiveId, activeMember } = useActiveMember(currentMembers);

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
        reject(new Error("无法读取媒体时长"));
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
      setFileError("文字类型不需要上传媒体");
      return false;
    }

    const match =
      (selectedType === "image" && file.type.startsWith("image/")) ||
      (selectedType === "audio" && file.type.startsWith("audio/")) ||
      (selectedType === "video" && file.type.startsWith("video/"));

    if (!match) {
      setFileError("媒体类型与选择的能量类型不匹配");
      return false;
    }

    if (selectedType === "audio" || selectedType === "video") {
      try {
        const duration = await getMediaDuration(file);
        const limit = selectedType === "audio" ? 60 : 15;
        if (duration > limit) {
          setFileError(
            selectedType === "audio"
              ? "语音时长不能超过 60 秒"
              : "视频时长不能超过 15 秒"
          );
          return false;
        }
      } catch (error) {
        setFileError("无法读取媒体时长");
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
      setRecordError("无法获取麦克风权限");
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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("正在发送...");
    const formData = new FormData(event.currentTarget);
    const memberId = formData.get("memberId");
    const fileValid = await validateFile();
    const media = formData.get("media") as File | null;

    if (!memberId) {
      setStatus("请选择接收对象");
      return;
    }

    if (selectedType !== "text" && (!media || media.size === 0) && !recordedBlob) {
      setStatus("请选择对应的媒体文件");
      return;
    }

    if (!fileValid) {
      setStatus("媒体文件不符合要求");
      return;
    }

    if (selectedType === "text") {
      formData.delete("media");
    }

    if (selectedType === "audio" && recordedBlob && (!media || media.size === 0)) {
      if (recordDuration && recordDuration > 60) {
        setStatus("语音时长不能超过 60 秒");
        return;
      }
      const recordedFile = new File([recordedBlob], `record-${Date.now()}.webm`, { type: recordedBlob.type });
      formData.set("media", recordedFile);
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "发送失败");
      }

      setStatus("发送成功，能量已进入瓶中。");
      formRef.current?.reset();
      resetRecording();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "发送失败，请稍后再试。");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-leaf">写能量</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          新建能量纸条
        </h2>
        <p className="mt-2 text-sm text-ink/70">记录今天的闪光点，让自己和孩子都被看到。</p>
      </header>

      <form ref={formRef} onSubmit={onSubmit} className="gradient-panel rounded-xxl p-6 shadow-soft space-y-5">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">发送给</label>
          {loadingMembers ? (
            <p className="mt-2 text-sm text-ink/60">正在加载成员...</p>
          ) : memberError ? (
            <p className="mt-2 text-sm text-ember">{memberError}</p>
          ) : currentMembers.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">暂无成员，请先在家庭管理中添加。</p>
          ) : (
            <div className="mt-2 space-y-3">
              <MemberTabs members={currentMembers} activeId={activeId} onChange={setActiveId} />
              {activeMember && (
                <div className="text-xs text-ink/60">
                  当前对象：{activeMember.name}
                </div>
              )}
              <input type="hidden" name="memberId" value={activeId} />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">能量类型</label>
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
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">今天的闪光点</label>
          <input
            name="title"
            placeholder="一句话标题，比如：完成作业、练琴 30 分钟"
            required
            className="mt-2 w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
          <textarea
            name="text"
            rows={4}
            placeholder="写下今天完成的事情、感受或鼓励..."
            className="mt-2 w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">日期</label>
          <input
            type="date"
            name="eventDate"
            defaultValue={today}
            className="mt-2 w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-ink/70">添加媒体</label>
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
                    开始录音
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-full bg-ember px-3 py-1 text-xs font-semibold text-white shadow-glow"
                    onClick={stopRecording}
                  >
                    停止录音
                  </button>
                )}
                {recordedBlob && (
                  <button
                    type="button"
                    className="rounded-full border border-ember/40 px-3 py-1 text-xs text-ember"
                    onClick={resetRecording}
                  >
                    重新录音
                  </button>
                )}
                {recordDuration !== null && (
                  <span>时长：{Math.round(recordDuration)} 秒</span>
                )}
              </div>
              {recordedUrl && (
                <audio controls src={recordedUrl} className="mt-2 w-full" />
              )}
              {recordError && <p className="mt-2 text-xs text-ember">{recordError}</p>}
            </div>
          )}
          <p className="mt-2 text-xs text-ink/60">支持图片、语音（1 分钟内）和视频（15 秒内）。</p>
          {fileError && <p className="mt-2 text-xs text-ember">{fileError}</p>}
        </div>

        <div className="flex items-center justify-between">
          <button className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow">
            发送能量
          </button>
          {status && <span className="text-xs text-ink/70">{status}</span>}
        </div>
      </form>
    </div>
  );
}
