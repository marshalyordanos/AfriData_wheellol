// Notification center (right drawer). Each item opens its page (notification.link).
// The old list is kept in LegacyNotificationList.jsx.
import React, { useEffect, useMemo } from "react";
import { Drawer, Button, Segmented, Spin, Empty, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  Bell,
  CarFront,
  CheckCheck,
  CircleDollarSign,
  ShieldAlert,
  Info,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationFilter,
  selectUnreadCount,
} from "./NotificationRedux";

export const TYPE_META = {
  BOOKING: { icon: CarFront, color: "#1d4f91", bg: "rgba(29,79,145,0.12)", label: "Booking" },
  PAYMENT: { icon: CircleDollarSign, color: "#059669", bg: "rgba(5,150,105,0.12)", label: "Payment" },
  DISPUTE: { icon: ShieldAlert, color: "#d97706", bg: "rgba(217,119,6,0.12)", label: "Dispute" },
  ALERT: { icon: ShieldAlert, color: "#dc2626", bg: "rgba(220,38,38,0.12)", label: "Alert" },
  MESSAGE: { icon: MessageSquare, color: "#7c3aed", bg: "rgba(124,58,237,0.12)", label: "Message" },
  SYSTEM: { icon: Info, color: "#64748b", bg: "rgba(100,116,139,0.14)", label: "System" },
  PROMOTION: { icon: Bell, color: "#fc6b38", bg: "rgba(252,107,56,0.12)", label: "Promotion" },
};

export const timeAgo = (d) => {
  const t = dayjs(d);
  const s = dayjs().diff(t, "second");
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  if (h < 48) return "yesterday";
  return t.format("DD MMM, HH:mm");
};

const groupOf = (d) => {
  const t = dayjs(d);
  if (t.isSame(dayjs(), "day")) return "Today";
  if (t.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return "Earlier";
};

export const NotificationIcon = ({ type, size = 40 }) => {
  const meta = TYPE_META[type] || TYPE_META.SYSTEM;
  const Icon = meta.icon;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: meta.bg,
        color: meta.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={size * 0.48} strokeWidth={2} />
    </span>
  );
};

const NotificationsList = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, total, page, filter } = useSelector((s) => s.notifications);
  const unreadCount = useSelector(selectUnreadCount);

  useEffect(() => {
    if (open) dispatch(fetchNotifications({ page: 1, unread: filter === "unread" }));
  }, [open, filter, dispatch]);

  const shown = filter === "unread" ? items.filter((i) => !i.isRead) : items;
  const groups = useMemo(() => {
    const out = [];
    shown.forEach((n) => {
      const g = groupOf(n.createdAt);
      const last = out[out.length - 1];
      if (last && last.title === g) last.items.push(n);
      else out.push({ title: g, items: [n] });
    });
    return out;
  }, [shown]);

  const openItem = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n.id));
    if (n.link) {
      onClose();
      navigate(n.link);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={440}
      closable={false}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column" }, header: { display: "none" } }}
    >
      {/* header */}
      <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid var(--c-border, #eef0f4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--c-text, #0b1f44)" }}>Notifications</div>
            <div style={{ fontSize: 12.5, color: "var(--c-text-3, #64748b)", marginTop: 2 }}>
              {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
            </div>
          </div>
          <Tooltip title="Mark all as read">
            <Button
              icon={<CheckCheck size={16} />}
              disabled={!unreadCount}
              onClick={() => dispatch(markAllNotificationsRead())}
            >
              Mark all read
            </Button>
          </Tooltip>
        </div>
        <Segmented
          block
          style={{ marginTop: 14 }}
          value={filter}
          onChange={(v) => dispatch(setNotificationFilter(v))}
          options={[
            { label: "All", value: "all" },
            { label: `Unread${unreadCount ? ` (${unreadCount})` : ""}`, value: "unread" },
          ]}
        />
      </div>

      {/* list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && !items.length ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spin />
          </div>
        ) : !shown.length ? (
          <Empty
            style={{ marginTop: 64 }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          />
        ) : (
          groups.map((g) => (
            <div key={g.title}>
              <div
                style={{
                  padding: "12px 20px 6px",
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "var(--c-text-3, #64748b)",
                }}
              >
                {g.title}
              </div>
              {g.items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className="notif-row"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "12px 20px",
                    border: 0,
                    cursor: n.link ? "pointer" : "default",
                    background: n.isRead ? "transparent" : "var(--c-unread, rgba(252,107,56,0.06))",
                    borderLeft: `3px solid ${n.isRead ? "transparent" : "#fc6b38"}`,
                  }}
                >
                  <NotificationIcon type={n.type} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: n.isRead ? 600 : 800,
                          color: "var(--c-text, #0b1f44)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#fc6b38", flexShrink: 0 }} />
                      )}
                    </span>
                    <span
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontSize: 13,
                        lineHeight: "18px",
                        color: "var(--c-text-2, #475569)",
                        marginTop: 2,
                      }}
                    >
                      {n.message}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        fontSize: 12,
                        color: "var(--c-text-3, #94a3b8)",
                      }}
                    >
                      {timeAgo(n.createdAt)}
                      {n.link && (
                        <>
                          <span>·</span>
                          <span style={{ color: "#fc6b38", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
                            Open <ChevronRight size={13} />
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))
        )}

        {items.length > 0 && items.length < total && filter === "all" && (
          <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
            <Button loading={loading} onClick={() => dispatch(fetchNotifications({ page: page + 1 }))}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default NotificationsList;
