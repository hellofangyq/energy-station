function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDateTime(date: Date, lang: "zh" | "en" = "zh") {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const locale = lang === "en" ? "en-US" : "zh-CN";
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  if (isSameDay(date, now)) {
    return lang === "en" ? `Today ${timeLabel}` : `今天 ${timeLabel}`;
  }

  if (isSameDay(date, yesterday)) {
    return lang === "en" ? `Yesterday ${timeLabel}` : `昨天 ${timeLabel}`;
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  return `${dateLabel} ${timeLabel}`;
}

export function formatDateOnly(date: Date, lang: "zh" | "en" = "zh") {
  const locale = lang === "en" ? "en-US" : "zh-CN";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
