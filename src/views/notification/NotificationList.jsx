import React, { useEffect } from "react";
import { Drawer, List, Avatar, Button, Spin, Empty, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
} from "./NotificationRedux";

const { Text } = Typography;

const NotificationsList = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state) => state.notifications?.items || []
  );
  const loading = useSelector((state) => state.notifications?.loading);
  const unreadCount = useSelector((state) => selectUnreadCount(state));

  useEffect(() => {
    if (open) {
      dispatch(fetchNotifications());
    }
  }, [open, dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleMarkAll = () => {
    dispatch(markAllNotificationsRead());
  };

  return (
    <Drawer
      title={`Notifications (${unreadCount})`}
      placement="right"
      onClose={onClose}
      open={open}
      width={360}
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
          onClick={handleMarkAll}
          disabled={!notifications.length}
        >
          Mark all read
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty description="No notifications" />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              actions={
                item.read
                  ? []
                  : [
                      <Button
                        type="link"
                        onClick={() => handleMarkRead(item.id)}
                      >
                        Mark read
                      </Button>,
                    ]
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={
                      item?.actor?.profilePhoto || item?.sender?.profilePhoto
                    }
                  />
                }
                title={
                  <Text strong={!item.read}>
                    {item.title || item.message || "Notification"}
                  </Text>
                }
                description={
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {item.body || item.message}
                  </div>
                }
              />
              <div style={{ textAlign: "right", minWidth: 90 }}>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : ""}
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default NotificationsList;
