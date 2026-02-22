import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const sourceDir = path.join(rootDir, "node_modules", "@ffmpeg", "core", "dist", "esm");
const targetDir = path.join(rootDir, "public", "ffmpeg");

const files = [
  "ffmpeg-core.js",
  "ffmpeg-core.wasm"
];

if (!fs.existsSync(sourceDir)) {
  console.warn(`[ffmpeg] Source dir not found: ${sourceDir}`);
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  const src = path.join(sourceDir, file);
  const dest = path.join(targetDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`[ffmpeg] Missing file: ${src}`);
  }
}

console.log("[ffmpeg] Core files copied to public/ffmpeg");
