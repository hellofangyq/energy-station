import nodemailer from "nodemailer";

function getEnv(name: string) {
  return process.env[name] ?? "";
}

export function isEmailConfigured() {
  return (
    getEnv("SMTP_HOST") &&
    getEnv("SMTP_PORT") &&
    getEnv("SMTP_USER") &&
    getEnv("SMTP_PASS") &&
    getEnv("SMTP_FROM")
  );
}

export function createTransport() {
  const host = getEnv("SMTP_HOST");
  const port = Number(getEnv("SMTP_PORT"));
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendRejectionEmail(params: {
  to: string;
  senderName: string;
  memberName: string;
  noteTitle: string;
}) {
  if (!isEmailConfigured()) return;

  const from = getEnv("SMTP_FROM");
  const transport = createTransport();

  const subject = "能量站：能量纸条被拒收";
  const text = [
    `你好，${params.senderName}：`,
    `你的能量纸条“${params.noteTitle}”已被 ${params.memberName} 拒收。`,
    "你可以稍后再送上新的鼓励。"
  ].join("\n");

  await transport.sendMail({
    from,
    to: params.to,
    subject,
    text
  });
}
