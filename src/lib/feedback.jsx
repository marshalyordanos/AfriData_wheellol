/* Shared user feedback: form validation + server errors.
   Imported from "antd/es" directly so it never goes through the antd shim. */
import React from "react";
import { notification } from "antd/es";

export const SCROLL_OPTIONS = { behavior: "smooth", block: "center" };

notification.config({ placement: "bottomRight", bottom: 24, duration: 5, maxCount: 3 });

const List = ({ items }) => (
  <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "var(--c-text-2)", fontSize: 13.5, lineHeight: 1.6 }}>
    {items.map((t, i) => (
      <li key={i}>{t}</li>
    ))}
  </ul>
);

/** "'staff.first_name' is required" → "First name is required" */
const tidy = (text, name) => {
  let t = String(text || "").trim();
  t = t.replace(/'([^']+)'/g, (_, inner) => {
    const last = inner.split(".").pop().replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
    return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
  });
  if (!t && name) t = `${[].concat(name).pop()} is invalid`;
  return t;
};

/** Toast listing the fields that still need attention. */
export const showFormErrors = (errorFields = []) => {
  const msgs = errorFields
    .map((f) => tidy(f.errors?.[0], f.name))
    .filter(Boolean);
  if (!msgs.length) return;
  const unique = [...new Set(msgs)];
  notification.error({
    key: "form-errors",
    message: unique.length === 1 ? "Please fix this field" : `Please fix ${unique.length} fields`,
    description: unique.length === 1 ? unique[0] : <List items={unique.slice(0, 5).concat(unique.length > 5 ? [`+ ${unique.length - 5} more`] : [])} />,
  });
};

const TITLES = {
  0: "Can't reach the server",
  400: "Please check the details",
  401: "Your session has ended",
  403: "You don't have permission",
  404: "Not found",
  409: "This conflicts with existing data",
  413: "File is too large",
  422: "Please check the details",
  429: "Too many attempts",
};

/** Toast for an API error. `message` may be a string or an array of strings. */
export const showServerError = (message, status) => {
  const parts = (Array.isArray(message) ? message : [message])
    .flat()
    .map((m) => (typeof m === "object" && m ? m.message || JSON.stringify(m) : m))
    .filter(Boolean)
    .map(String);
  const text = parts.join(" · ") || "Something went wrong. Please try again.";
  const title = TITLES[status ?? 0] || (status >= 500 ? "Server error — please try again" : "Something went wrong");
  notification.error({
    key: `srv-${status}-${text}`,
    message: title,
    description: parts.length > 1 ? <List items={parts} /> : status === 0 && /network/i.test(text) ? "Check your internet connection and try again." : text,
  });
};
