import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const coreDir = path.join(rootDir, "node_modules", "@ffmpeg", "core", "dist", "esm");
const workerDir = path.join(rootDir, "node_modules", "@ffmpeg", "ffmpeg", "dist", "esm");
const targetDir = path.join(rootDir, "public", "ffmpeg");

const coreFiles = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

if (!fs.existsSync(coreDir)) {
  console.warn(`[ffmpeg] Core dir not found: ${coreDir}`);
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const file of coreFiles) {
  const src = path.join(coreDir, file);
  const dest = path.join(targetDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`[ffmpeg] Missing file: ${src}`);
  }
}

const workerSrc = path.join(workerDir, "worker.js");
const workerDest = path.join(targetDir, "ffmpeg-worker.js");
if (fs.existsSync(workerSrc)) {
  let content = fs.readFileSync(workerSrc, "utf8");
  content = content.replace(/"\.\/const\.js"/g, "\"/ffmpeg/const.js\"");
  content = content.replace(/"\.\/errors\.js"/g, "\"/ffmpeg/errors.js\"");
  fs.writeFileSync(workerDest, content);
} else {
  console.warn(`[ffmpeg] Missing worker file: ${workerSrc}`);
}

const constSrc = path.join(workerDir, "const.js");
const constDest = path.join(targetDir, "const.js");
if (fs.existsSync(constSrc)) {
  fs.copyFileSync(constSrc, constDest);
} else {
  console.warn(`[ffmpeg] Missing const file: ${constSrc}`);
}

const errorsSrc = path.join(workerDir, "errors.js");
const errorsDest = path.join(targetDir, "errors.js");
if (fs.existsSync(errorsSrc)) {
  fs.copyFileSync(errorsSrc, errorsDest);
} else {
  console.warn(`[ffmpeg] Missing errors file: ${errorsSrc}`);
}

const umdSrc = path.join(rootDir, "node_modules", "@ffmpeg", "ffmpeg", "dist", "umd", "ffmpeg.js");
const umdDest = path.join(targetDir, "ffmpeg.js");
if (fs.existsSync(umdSrc)) {
  fs.copyFileSync(umdSrc, umdDest);
} else {
  console.warn(`[ffmpeg] Missing ffmpeg UMD file: ${umdSrc}`);
}

console.log("[ffmpeg] Core files copied to public/ffmpeg");
