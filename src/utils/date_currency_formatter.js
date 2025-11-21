// Example: 159867.5855 -> "159,867.59 ETB"
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "";

  const num = Number(value);
  if (Number.isNaN(num)) return "";

  const formatted = new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `${formatted} ETB`; 
};


// ---- Safe date parser (MM/DD/YYYY + time) ----
const toDate = (input) => {
  if (!input) return null;
  if (input instanceof Date) return input;

  const str = String(input).trim();

  // Match: "11/23/2025, 10:00:00 AM"
  const regex =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i;

  const m = str.match(regex);

  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);

    let hour = 0,
      minute = 0,
      second = 0;

    if (m[4] !== undefined) {
      hour = parseInt(m[4], 10);
      minute = parseInt(m[5], 10);
      second = parseInt(m[6] || "0", 10);

      const ampm = m[7].toUpperCase();
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
    }

    return new Date(year, month - 1, day, hour, minute, second);
  }

  // fallback
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

// ---- Format readable date ----
// Example: "11/23/2025, 10:00:00 AM"
// Output: "November 23 , 2025 at 10:00 AM"
export const formatReadableDate = (input) => {
  const d = toDate(input);
  if (!d) return "";

  const month = d.toLocaleString("en-US", { month: "long" });
  const day = d.getDate();
  const year = d.getFullYear();

  const time = d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // You requested this exact format (with space before comma)
  return `${month} ${day} , ${year} at ${time}`;
};
