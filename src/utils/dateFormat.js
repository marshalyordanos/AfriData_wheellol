/* Compact date helpers used by the redesigned tables. */
export const parseDate = (d) => {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

export const shortDate = (d) => {
  const dt = parseDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const shortTime = (d) => {
  const dt = parseDate(d);
  if (!dt) return "";
  return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const dayRange = (s, e) => {
  const a = parseDate(s);
  const b = parseDate(e);
  if (!a || !b) return null;
  return Math.max(1, Math.ceil((b - a) / 86400000));
};

export const relTime = (d) => {
  const dt = parseDate(d);
  if (!dt) return "";
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return shortDate(dt);
};
