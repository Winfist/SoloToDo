export function getLocalDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getToday() {
  return getLocalDateKey(new Date());
}

export function parseLocalDateKey(dateKey) {
  if (!dateKey) return null;
  const [year, month, day] = String(dateKey).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function addLocalDays(dateOrKey, days) {
  const base = typeof dateOrKey === "string"
    ? parseLocalDateKey(dateOrKey)
    : new Date(dateOrKey || Date.now());
  if (!base) return null;
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function getYesterdayKey() {
  return getLocalDateKey(addLocalDays(new Date(), -1));
}

export function getDateTimeLocalValue(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const dateKey = getLocalDateKey(d);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${dateKey}T${hours}:${minutes}`;
}

export function formatLocalTime(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function formatLocalDateTime(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return `${getLocalDateKey(d)} ${formatLocalTime(d)}`;
}

export function endOfLocalDay(dateKey = getToday()) {
  const d = parseLocalDateKey(dateKey) || new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function buildReminderDate(preset, { dueDate, customValue } = {}) {
  const now = new Date();
  if (!preset || preset === "none") return null;

  if (preset === "in30") {
    return new Date(now.getTime() + 30 * 60 * 1000);
  }

  if (preset === "evening") {
    const d = new Date(now);
    d.setHours(18, 0, 0, 0);
    if (d <= now) d.setTime(now.getTime() + 60 * 60 * 1000);
    return d;
  }

  if (preset === "tomorrow_morning") {
    const d = addLocalDays(now, 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  if (preset === "before_due" && dueDate) {
    const due = parseLocalDateKey(dueDate);
    if (!due) return null;
    due.setDate(due.getDate() - 1);
    due.setHours(18, 0, 0, 0);
    if (due <= now) {
      const fallback = new Date(now);
      fallback.setHours(18, 0, 0, 0);
      if (fallback <= now) fallback.setTime(now.getTime() + 60 * 60 * 1000);
      return fallback;
    }
    return due;
  }

  if (preset === "custom" && customValue) {
    const custom = new Date(customValue);
    return Number.isNaN(custom.getTime()) ? null : custom;
  }

  return null;
}
