function ensureLocalDate(date: Date): Date {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

export function formatDay(date: Date) {
  const localDate = ensureLocalDate(date);
  return localDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDayFull(date: Date) {
  const localDate = ensureLocalDate(date);
  return localDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDate(date: Date) {
  const localDate = ensureLocalDate(date);
  const now = new Date();
  const isOld = now.getFullYear() - localDate.getFullYear() > 0;
  return localDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: isOld ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateFull(date: Date) {
  const localDate = ensureLocalDate(date);
  return localDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
