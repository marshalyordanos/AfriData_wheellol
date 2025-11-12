import React, { useEffect, useRef } from "react";
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
    authUser?.id ||
    authUser?.userId ||
    authUser?.user?.id ||
    (JSON.parse(localStorage.getItem("user") || "{}") || {}).id ||
    null;

  const [page, setPage] = React.useState(1);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && currentUserId) {
      // reset to page 1 when opening
      setPage(1);
      dispatch(fetchNotifications({ userid: currentUserId, page: 1 })).then(
        (res) => {
          const data = res.payload?.data || [];
          const total = res.payload?.pagination?.total ?? data.length;
          setHasMore((data.length || 0) < total);
        }
      );
    }
  }, [open, dispatch, currentUserId]);

  // load next page
  const loadNextPage = async () => {
    if (!currentUserId) return;
    if (!hasMore) return;
    const next = page + 1;
    setIsFetchingMore(true);
    try {
      const res = await dispatch(
        fetchNotifications({ userid: currentUserId, page: next })
      );
      const data = res.payload?.data || [];
      const total =
        res.payload?.pagination?.total ?? notifications.length + data.length;
      // advance page only if we received items
      if ((data.length || 0) > 0) setPage(next);
      // determine if there are more items to fetch
      setHasMore(notifications.length + (data.length || 0) < total);
    } catch (err) {
      console.error("Failed to load more notifications", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead({ id, userId: currentUserId }));
  };

  const handleScroll = (e) => {
    try {
      const target = e?.target;
      if (!target) return;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      if (distanceFromBottom < 120 && !isFetchingMore && !loading) {
        loadNextPage();
      }
    } catch (err) {
      console.error(err);
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
      bodyStyle={{ padding: 12 }}
    >
      {loading && page === 1 ? (
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
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ maxHeight: "85vh", overflow: "auto", paddingRight: 8 }}
        >
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

          {isFetchingMore && (
            <div style={{ textAlign: "center", padding: 12 }}>
              <Spin />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default NotificationsList;
