import React from "react";
import "../modern/modern.css";

/* Tailwind text-* class → accent colour, so existing call sites keep their colours. */
const COLOR_MAP = {
  indigo: "#4f46e5",
  blue: "#1d4f91",
  sky: "#0284c7",
  yellow: "#d97706",
  amber: "#d97706",
  orange: "#fc6b38",
  red: "#dc2626",
  rose: "#e11d48",
  green: "#059669",
  emerald: "#059669",
  purple: "#7c3aed",
  violet: "#7c3aed",
  gray: "#94a3b8",
  teal: "#0d9488",
};

const pickColor = (cls = "") => {
  const m = String(cls).match(/text-([a-z]+)-/);
  return (m && COLOR_MAP[m[1]]) || "#fc6b38";
};

const SummaryCard = ({ title, value, description, Icon, iconColor = "text-blue-500", onClick, active }) => {
  const c = pickColor(iconColor);
  return (
    <div
      className={`mp-stat ${onClick ? "is-clickable" : ""} ${active ? "is-active" : ""}`}
      style={{ "--mp-accent": c, "--mp-accent-soft": `${c}1a`, flex: "1 1 200px", minWidth: 190 }}
      onClick={onClick}
    >
      <div className="mp-stat-top">
        <span className="mp-stat-label">{title}</span>
        {Icon && (
          <span className="mp-stat-icon">
            <Icon />
          </span>
        )}
      </div>
      <div className="mp-stat-value">{value ?? 0}</div>
      {description && (
        <div className="mp-stat-foot">
          <span>{description}</span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
