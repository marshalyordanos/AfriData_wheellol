import React, { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import { Button, Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";

// Helper: format numbers
export function formatNumberHuman(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Helper to access nested values safely
const getNestedValue = (obj, path) =>
  path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);

const CommonCard = ({
  item,
  fieldMap,
  title,
  hasDelete = false,
  btnName,
  cFunc,
  status = "",
  onActionClick,
  actionItems = [],
  onCardClick,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [remark, setRemark] = useState("");
  const [salesColor, setSalesColor] = useState({
    bgColor: "#f3f4f6",
    color: "#374151",
  });

  // Set color based on status
  const setColor = () => {
    switch (status) {
      case "Paid":
        setSalesColor({ bgColor: "#dcfce7", color: "#166534" });
        break;
      case "Not Paid":
        setSalesColor({ bgColor: "#bfdbfe", color: "#1e3a8a" });
        break;
      case "Void":
        setSalesColor({ bgColor: "#fef3f3", color: "#b91c1c" });
        break;
      case "Void Requested":
        setSalesColor({ bgColor: "#fef9c3", color: "#78350f" });
        break;
      default:
        setSalesColor({ bgColor: "#f3f4f6", color: "#374151" });
    }
  };

  useEffect(() => setColor(), [status]);

  // Build details dynamically and normalize values so we don't render raw objects
  const details = Object.entries(fieldMap).map(([key, labelOrSuffix]) => {
    const [labelRaw, suffix] = (labelOrSuffix || "").split("__");
    const label = labelRaw || key;
    const rawValue = getNestedValue(item, key);

    let cleanValue = "";
    if (rawValue === null || rawValue === undefined) {
      cleanValue = "";
    } else if (typeof rawValue === "string") {
      cleanValue = rawValue.replace(/<[^>]*>/g, "").trim();
    } else if (Array.isArray(rawValue)) {
      // join array values (prefer primitives)
      cleanValue = rawValue
        .map((v) =>
          v && typeof v === "object" ? v.name || JSON.stringify(v) : String(v)
        )
        .join(", ");
    } else if (typeof rawValue === "object") {
      // Prefer common display fields
      if (rawValue.name) cleanValue = String(rawValue.name);
      else if (rawValue.firstName || rawValue.lastName)
        cleanValue = `${rawValue.firstName || ""} ${
          rawValue.lastName || ""
        }`.trim();
      else if (rawValue.id && rawValue.id === rawValue)
        cleanValue = String(rawValue.id);
      else cleanValue = JSON.stringify(rawValue);
    } else {
      cleanValue = String(rawValue);
    }

    let value;
    if (suffix) {
      if (suffix === "ETB") {
        const num = Number(String(cleanValue).replace(/,/g, "")) || 0;
        value = `${formatNumberHuman(num)} ${suffix}`;
      } else {
        value = `${cleanValue} ${suffix}`;
      }
    } else {
      value = cleanValue;
    }

    return { label, value };
  });

  return (
    <div
      onClick={() => onCardClick && onCardClick(item)}
      style={{
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 12,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)")
      }
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        {title && (
          <div style={{ fontWeight: 600, fontSize: 16, color: "#111827" }}>
            {Array.isArray(title)
              ? title.map((t, i) => (
                  <span key={i} style={{ marginRight: 6 }}>
                    {getNestedValue(item, t) || t}
                  </span>
                ))
              : getNestedValue(item, title) || title}
          </div>
        )}

        <Dropdown
          menu={{
            items: actionItems,
            onClick: (value) => {
              try {
                value?.domEvent?.stopPropagation();
              } catch (err) {}
              onActionClick && onActionClick(value, item);
            },
          }}
          trigger={["click"]}
          placement="bottomLeft"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: 20, color: "#6b7280" }} />}
            onClick={(e) => e.stopPropagation()}

          />
        </Dropdown>
        
      </div>

      {/* Details */}
      {details.map((detail, idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#6b7280", fontWeight: 500 }}>
              {detail.label}
            </span>
            <span style={{ color: "#111827", fontWeight: 600 }}>
              {detail.value}
            </span>
          </div>
          {idx < details.length - 1 && (
            <hr
              style={{
                margin: "8px 0",
                border: "none",
                borderTop: "1px solid #e5e7eb",
              }}
            />
          )}
        </div>
      ))}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {hasDelete && (
          <button
            onClick={() => setModalVisible(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 10,
              backgroundColor: "#fff",
              border: "1px solid #f87171",
              color: "#b91c1c",
              fontWeight: 500,
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            <MdDelete size={18} />
            Delete
          </button>
        )}
        {(item?.status === "Paid" || item?.status === "Not Paid") &&
          btnName && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "1px solid #3b82f6",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 500,
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              {btnName}
            </button>
          )}
      </div>

      {/* Delete Modal */}
      {modalVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: 28,
              borderRadius: 14,
              width: 340,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 22 }}>
              Are you sure you want to delete this item?
            </p>
            <div
              style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setModalVisible(false)}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  color: "#374151",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: "8px 18px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remark Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: 28,
              borderRadius: 14,
              width: 340,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            <input
              placeholder="Remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginBottom: 20,
                fontSize: 14,
              }}
            />
            <div
              style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  color: "#374151",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!remark) return;
                  cFunc(item.id, remark);
                  setShowModal(false);
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonCard;
