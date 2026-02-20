function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDateTime(date: Date) {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const timeLabel = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  if (isSameDay(date, now)) {
    return `今天 ${timeLabel}`;
  }

  if (isSameDay(date, yesterday)) {
    return `昨天 ${timeLabel}`;
  }

  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  return `${dateLabel} ${timeLabel}`;
}

export function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
