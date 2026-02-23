import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getFamilyContext } from "@/lib/family";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { tmpdir } from "os";
import { promises as fs } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const FFMPEG_PATH = ffmpegPath ?? null;

async function compressVideoOnServer(input: Buffer, inputExt: string) {
  if (!FFMPEG_PATH) {
    return null;
  }
  ffmpeg.setFfmpegPath(FFMPEG_PATH);
  const tempDir = tmpdir();
  const inputPath = path.join(tempDir, `energy-in-${Date.now()}.${inputExt}`);
  const outputPath = path.join(tempDir, `energy-out-${Date.now()}.mp4`);

  await fs.writeFile(inputPath, input);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-vf", "scale=-2:480",
          "-r", "24",
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-b:v", "450k",
          "-maxrate", "500k",
          "-bufsize", "1000k",
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "64k",
          "-movflags", "+faststart"
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    const data = await fs.readFile(outputPath);
    return data;
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const context = await getFamilyContext(userId);
  if (!context) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: {
      ...(context.role === "MEMBER" && context.linkedMemberId
        ? { memberId: context.linkedMemberId }
        : { member: { userId: context.ownerId } })
    },
    include: {
      member: true,
      sender: true
    },
    orderBy: { createdAt: "desc" }
  });

  if (context.role === "MEMBER" && context.linkedMemberId) {
    notes.forEach((note) => {
      if (note.memberId === context.linkedMemberId) {
        note.member.name = context.userName;
      }
    });
  }

  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const context = await getFamilyContext(userId);
  if (!context) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const memberId = String(formData.get("memberId") ?? "");
  const typeRaw = String(formData.get("type") ?? "text");
  const title = String(formData.get("title") ?? "");
  const text = String(formData.get("text") ?? "");
  const eventDateRaw = String(formData.get("eventDate") ?? "");
  const media = formData.get("media") as File | null;
  const clientCompressed = String(formData.get("clientCompressed") ?? "0") === "1";

  if (!memberId) {
    return NextResponse.json({ error: "缺少接收人" }, { status: 400 });
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, userId: context.ownerId }
  });
  if (!member) {
    return NextResponse.json({ error: "无权操作该成员" }, { status: 403 });
  }

  if (!title) {
    return NextResponse.json({ error: "缺少标题" }, { status: 400 });
  }

  const allowedTypes = ["text", "image", "audio", "video"] as const;
  const type = (allowedTypes.includes(typeRaw as (typeof allowedTypes)[number]) ? typeRaw : "text") as typeof allowedTypes[number];
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "不支持的类型" }, { status: 400 });
  }

  if (type !== "text" && (!media || media.size === 0)) {
    return NextResponse.json({ error: "缺少媒体文件" }, { status: 400 });
  }

  const eventDate = eventDateRaw ? new Date(`${eventDateRaw}T12:00:00`) : new Date();

  let mediaUrl: string | null = null;
  if (media && media.size > 0) {
    const extension = media.name.split(".").pop() || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;
    let buffer = Buffer.from(await media.arrayBuffer());
    let outputExt = extension;
    let outputType = media.type || undefined;

    if (type === "video" && !clientCompressed) {
      const compressed = await compressVideoOnServer(buffer, extension);
      if (compressed && compressed.length > 0) {
        buffer = compressed;
        outputExt = "mp4";
        outputType = "video/mp4";
      }
    }

    if (BLOB_TOKEN) {
      const finalName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${outputExt}`;
      const blob = await put(finalName, buffer, {
        access: "public",
        contentType: outputType,
        token: BLOB_TOKEN
      });
      mediaUrl = blob.url;
    } else {
      await mkdir(UPLOAD_DIR, { recursive: true });
      const finalName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${outputExt}`;
      await writeFile(path.join(UPLOAD_DIR, finalName), buffer);
      mediaUrl = `/uploads/${finalName}`;
    }
  }

  const note = await prisma.note.create({
    data: {
      memberId,
      senderId: userId,
      type,
      title: title || "能量记录",
      text,
      mediaUrl,
      status: "PENDING",
      eventDate
    }
  });

  return NextResponse.json({ note });
}
