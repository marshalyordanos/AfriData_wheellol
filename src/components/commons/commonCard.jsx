import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { AiOutlineClockCircle, AiOutlineEdit } from "react-icons/ai";
import { MdDelete } from "react-icons/md";
import { Button, Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";

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
const getNestedValue = (obj, path) => {
  return path
    .split(".")
    .reduce((acc, part) => (acc ? acc[part] : undefined), obj);
};

// Normalize different value types to a renderable string
const formatValue = (raw) => {
  if (raw === null || raw === undefined) return "-";
  if (Array.isArray(raw)) {
    // join array of primitives or objects by name/id
    const parts = raw.map((r) => {
      if (r == null) return "";
      if (typeof r === "object")
        return r.name || r.title || r.id || JSON.stringify(r);
      return String(r);
    });
    return parts.filter(Boolean).join(", ");
  }
  if (typeof raw === "object") {
    // prefer common fields
    if (raw.name) return String(raw.name);
    if (raw.title) return String(raw.title);
    if (raw.firstName || raw.lastName)
      return `${raw.firstName || ""} ${raw.lastName || ""}`.trim();
    if (raw.id) return String(raw.id);
    try {
      return JSON.stringify(raw);
    } catch (e) {
      return "-";
    }
  }
  // primitive -> string
  return String(raw);
};

const CommonCard = ({
  item,
  fieldMap,
  title,
  hasDelete = false,
  fetchFunc,
  url,
  btnName,
  cFunc,
  deleteSchema,
  deleteSchema2,
  status = "",
  vstock,
  onActionClick,
  actionItems = [],
  onCardClick,
}) => {
  const navigate = useNavigate();
  const User = useSelector(selectCurrentUser);
  const currentUser = User || User.user;

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

  const currentRole = normalizeRole(currentUser) || "superadmin";
  const [modalVisible, setModalVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [remark, setRemark] = useState("");
  const [salesColor, setSalesColor] = useState({
    bgColor: "#c7c7c7",
    color: "#030303",
  });

  // Set color based on status
  const setColor = () => {
    switch (status) {
      case "Paid":
        setSalesColor({ bgColor: "#c3f6cf", color: "#166534" });
        break;
      case "Not Paid":
        setSalesColor({ bgColor: "#184781", color: "white" });
        break;
      case "Void":
        setSalesColor({ bgColor: "#184781", color: "white" });
        break;
      case "Void Requested":
        setSalesColor({ bgColor: "#fbbf24", color: "white" });
        break;
      default:
        setSalesColor({ bgColor: "#c7c7c7", color: "#030303" });
    }
  };

  useEffect(() => {
    setColor();
  }, [status]);

  // Build details array dynamically and normalize values
  const details = Object.entries(fieldMap).map(([key, labelOrSuffix]) => {
    const parts = String(labelOrSuffix).split("__");
    const label = parts[0]; // Display label
    const suffix = parts[1] || "";
    const rawValue = getNestedValue(item, key);
    let value = formatValue(rawValue);

    if (suffix) {
      if (suffix === "ETB") {
        // attempt numeric formatting
        const n = Number(String(value).replace(/,/g, ""));
        value = isNaN(n) ? value : `${formatNumberHuman(n)} ${suffix}`;
      } else {
        value = `${value} ${suffix}`;
      }
    }

    return { label, value };
  });

  // details prepared for rendering

  return (
    <div
      onClick={() => {
        onCardClick && onCardClick(item);
      }}
      style={{
        padding: 7,
        backgroundColor: "white",
        borderRadius: 10,
        marginBottom: 20,
      }}
      className="shadow-lg"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        {title && (
          <div style={{ maxWidth: "72%" }}>
            {Array.isArray(title) ? (
              title.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "inline-block",
                    marginRight: 6,
                    fontSize: 15,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    verticalAlign: "middle",
                  }}
                >
                  {formatValue(getNestedValue(item, t)) || t}
                </div>
              ))
            ) : (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatValue(getNestedValue(item, title)) || title}
              </div>
            )}
          </div>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={{
              items: actionItems.map((action) => ({
                ...action,
                label: (
                  <div style={{ pointerEvents: "none" }}>{action.label}</div>
                ),
              })),
              onClick: ({ key, domEvent, item: menuItem }) => {
                domEvent.stopPropagation();
                onActionClick &&
                  onActionClick({ key, domEvent, menuItem }, item);
              },
            }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 20 }} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      </div>

      {/* Details */}
      {details.map((detail, idx) => (
        <div key={idx}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 1,
            }}
          >
            <span style={{ color: "#A7A7A7", fontSize: 12.5 }}>
              {detail.label}
            </span>
            <span style={{ fontSize: 12.5, color: "#333" }}>
              {detail.value}
            </span>
          </div>
          {idx < details.length - 1 && (
            <hr style={{ margin: "6px 0", borderColor: "#C3C3C3" }} />
          )}
        </div>
      ))}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {hasDelete && (
          <button
            onClick={() => setModalVisible(true)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "5px 15px",
              borderRadius: 8,
              backgroundColor: "white",
              border: "none",
            }}
          >
            <MdDelete size={24} color="#3393CE" />
            <span style={{ color: "#3393CE", marginLeft: 5 }}>Delete</span>
          </button>
        )}
        {(item?.status === "Paid" || item?.status === "Not Paid") &&
          btnName && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "5px 15px",
                borderRadius: 8,
                border: "1px solid #3393CE",
                backgroundColor: "white",
              }}
            >
              {btnName}
            </button>
          )}
      </div>

      {/* Chat button for disputes visible to non-hosts / superadmin */}
      {item && item.dispute && currentRole !== "host" && (
        <div style={{ marginTop: 10 }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              const bookingId = item.id || item._id;
              if (bookingId)
                navigate(`/dash/messages/${bookingId}`, {
                  state: { from: "card", chatPartner: item.guest },
                });
            }}
          >
            Go To Chat
          </Button>
        </div>
      )}

      {/* Delete Modal */}
      {modalVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: 300,
            }}
          >
            <p>Are you sure you want to delete this item?</p>
            <div style={{ display: "flex", gap: 15 }}>
              <button
                onClick={() => setModalVisible(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ccc",
                  borderRadius: 5,
                }}
              >
                Cancel
              </button>
              <button
                // onClick={handleDelete}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3393CE",
                  color: "white",
                  borderRadius: 5,
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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: 300,
            }}
          >
            <input
              placeholder="Remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 6,
                border: "1px solid #CCC",
                marginBottom: 20,
              }}
            />
            <div style={{ display: "flex", gap: 15 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ccc",
                  borderRadius: 5,
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
                  padding: "10px 20px",
                  backgroundColor: "#3393CE",
                  color: "white",
                  borderRadius: 5,
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
