import React from "react";
import { Button, Dropdown } from "antd";
import { MoreOutlined, MessageOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import { StatusPill } from "../modern/ModernUI";
import "../modern/modern.css";

// Helper function to format numbers
export function formatNumberHuman(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Helper to safely access nested values like "model.name"
const getNestedValue = (obj, path) =>
  String(path)
    .split(".")
    .reduce((acc, part) => (acc ? acc[part] : undefined), obj);

// Normalize different value types to a renderable string
const formatValue = (raw) => {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  if (Array.isArray(raw)) {
    return raw
      .map((r) => {
        if (r == null) return "";
        if (typeof r === "object") return r.name || r.title || r.id || "";
        return String(r);
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof raw === "object") {
    if (raw.name) return String(raw.name);
    if (raw.title) return String(raw.title);
    if (raw.firstName || raw.lastName)
      return `${raw.firstName || ""} ${raw.lastName || ""}`.trim();
    if (raw.id) return String(raw.id);
    return "—";
  }
  return String(raw);
};

const STATUS_KEYS = /status|active/i;

/**
 * Mobile list card. fieldMap: { "path.to.value": "Label" | "Label__ETB" }
 */
const CommonCard = ({
  item,
  fieldMap = {},
  title,
  onActionClick,
  actionItems = [],
  onCardClick,
}) => {
  const navigate = useNavigate();
  const User = useSelector(selectCurrentUser);

  const normalizeRole = (u) => {
    if (!u) return null;
    if (typeof u === "string") return u.toLowerCase();
    if (u.role) {
      if (typeof u.role === "string") return u.role.toLowerCase();
      if (u.role.name) return String(u.role.name).toLowerCase();
    }
    if (u.user) return normalizeRole(u.user);
    return null;
  };
  const currentRole = normalizeRole(User) || "superadmin";

  const details = Object.entries(fieldMap).map(([key, labelOrSuffix]) => {
    const [label, suffix = ""] = String(labelOrSuffix).split("__");
    const rawValue = getNestedValue(item, key);
    let value = formatValue(rawValue);
    if (suffix && value !== "—") {
      if (suffix === "ETB") {
        const n = Number(String(value).replace(/,/g, ""));
        value = isNaN(n) ? value : `${formatNumberHuman(n)} ETB`;
      } else value = `${value} ${suffix}`;
    }
    const isStatus = STATUS_KEYS.test(key) || STATUS_KEYS.test(label);
    return { label, value, isStatus, raw: rawValue };
  });

  const titleText = Array.isArray(title)
    ? [...new Set(title.map((t) => formatValue(getNestedValue(item, t))))]
        .filter((v) => v && v !== "—")
        .join(" ")
    : title
    ? formatValue(getNestedValue(item, title))
    : "";

  return (
    <div className="mp-mcard" onClick={() => onCardClick && onCardClick(item)}>
      <div className="mp-mcard-head">
        <div className="mp-cell-main" style={{ fontSize: 15, minWidth: 0 }}>
          {titleText || "—"}
        </div>
        {actionItems.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              menu={{
                items: actionItems,
                onClick: ({ key, domEvent, item: menuItem }) => {
                  domEvent.stopPropagation();
                  onActionClick && onActionClick({ key, domEvent, menuItem }, item);
                },
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <button className="mp-iconbtn" aria-label="More actions">
                <MoreOutlined />
              </button>
            </Dropdown>
          </div>
        )}
      </div>

      {details.map((d, idx) => (
        <div key={idx} className="mp-mcard-row">
          <span>{d.label}</span>
          {d.isStatus && d.value !== "—" ? (
            <StatusPill
              status={typeof d.raw === "boolean" ? (d.raw ? "active" : "inactive") : d.value}
            >
              {typeof d.raw === "boolean" ? (d.raw ? "Active" : "Inactive") : undefined}
            </StatusPill>
          ) : (
            <span style={{ fontWeight: 500, color: "var(--c-text)", textAlign: "right" }}>{d.value}</span>
          )}
        </div>
      ))}

      {item && item.dispute && currentRole !== "host" && (
        <div style={{ marginTop: 10 }}>
          <Button
            icon={<MessageOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              const bookingId = item.id || item._id;
              if (bookingId)
                navigate(`/dash/messages/${bookingId}`, {
                  state: { from: "card", chatPartner: item.guest },
                });
            }}
          >
            Open chat
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommonCard;
