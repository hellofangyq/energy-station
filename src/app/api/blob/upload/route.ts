import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
            "audio/mpeg",
            "audio/mp4",
            "audio/webm",
            "audio/ogg",
            "audio/wav",
            "video/mp4",
            "video/quicktime",
            "video/webm"
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId })
        };
      },
      onUploadCompleted: async () => {
        return;
      }
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
