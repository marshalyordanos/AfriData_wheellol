import React, { useEffect } from "react";
import {
  Drawer,
  List,
  Avatar,
  Button,
  Spin,
  Empty,
  Typography,
  Tag,
  Card,
  Space,
} from "antd";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectUnreadCount,
} from "./NotificationRedux";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import {
  BellOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const typeColors = {
  PAYMENT: "green",
  BOOKING: "blue",
  DISPUTE: "orange",
  SYSTEM: "purple",
  DEFAULT: "gray",
};

const typeIcons = {
  PAYMENT: <DollarCircleOutlined />,
  BOOKING: <BellOutlined />,
  DISPUTE: <WarningOutlined />,
  SYSTEM: <InfoCircleOutlined />,
  DEFAULT: <InfoCircleOutlined />,
};

const NotificationsList = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state) => state.notifications?.items || []
  );
  const loading = useSelector((state) => state.notifications?.loading);
  const unreadCount = useSelector((state) => selectUnreadCount(state));

  const authUser = useSelector(selectCurrentUser);
  const currentUserId =
    authUser?.id || authUser?.userId || authUser?.user?.id || null;

  useEffect(() => {
    if (open && currentUserId) {
      dispatch(fetchNotifications({ userid: currentUserId }));
    }
  }, [open, dispatch, currentUserId]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead({ id, userId: currentUserId }));
  };

  const handleMarkAllAndClose = async () => {
    if (!currentUserId) return;
    try {
      await dispatch(markAllNotificationsRead(currentUserId));
      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BellOutlined />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Tag color="red" style={{ marginLeft: "auto" }}>
              {unreadCount} Unread
            </Tag>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      styles={{ body: { padding: "12px" } }}
    >
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          size="small"
          onClick={handleMarkAllAndClose}
          disabled={!notifications.length || loading}
          loading={loading}
        >
          Mark all as read
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          description="You're all caught up! 🎉"
          imageStyle={{ height: 100 }}
          style={{ marginTop: 60 }}
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={notifications}
          renderItem={(item) => {
            const color = typeColors[item.type] || typeColors.DEFAULT;
            const icon = typeIcons[item.type] || typeIcons.DEFAULT;
            return (
              <Card
                key={item.id}
                style={{
                  marginBottom: 12,
                  backgroundColor: item.isRead ? "#fafafa" : "#e6f7ff",
                  borderRadius: 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
                bodyStyle={{ padding: 14 }}
              >
                <Space align="start" style={{ width: "100%" }}>
                  <Avatar
                    icon={icon}
                    style={{
                      backgroundColor: color,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                    size="large"
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <Text strong={!item.isRead}>{item.title}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </div>
                    <Text
                      type="secondary"
                      style={{ display: "block", marginTop: 4 }}
                    >
                      {item.message}
                    </Text>

                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {!item.isRead && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleMarkRead(item.id)}
                          icon={<CheckCircleOutlined />}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </Space>
              </Card>
            );
          }}
        />
      )}
    </Drawer>
  );
};

export default NotificationsList;
