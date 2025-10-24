import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchChatsForUser,
  selectChats,
  selectChatsLoading,
} from "./messageRedux";
import { List, Avatar, Badge, Empty, Spin, Input } from "antd";
import MessagesService from "./MessagesService";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser } from "../../redux/auth/authSlice";

const ChatsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chats = useSelector(selectChats);
  const loading = useSelector(selectChatsLoading);
  const currentUser = useSelector(selectCurrentUser);
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  })();
  const userId = currentUser?.id || storedUser?.id || null;
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!userId) return;

    dispatch(fetchChatsForUser(userId));

    MessagesService.getAllUnreadMessagesOfAUser(userId)
      .then((res) => {
        const count = res?.data?.count ?? 0;
        setUnreadCount(Number(count));
      })
      .catch(() => {});
  }, [userId]);
  // UI return
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "200px",
        }}
      >
        <Spin size="large" />
      </div>
    );

  if (!chats || chats.length === 0) return <Empty description="No chats" />;

  const filtered = chats.filter((c) => {
    if (!query) return true;
    const summary = c.bookingSummary || {};
    return (
      (summary.id || "").toLowerCase().includes(query.toLowerCase()) ||
      (c.lastMessage?.content || "").toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Chats</h2>
          <Badge count={unreadCount} />
        </div>
        <Input.Search
          placeholder="Search by booking id or message"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 320 }}
          allowClear
        />
      </div>

      <List
        itemLayout="horizontal"
        dataSource={filtered}
        renderItem={(chat) => {
          const last = chat.lastMessage || {};
          const summary = chat.bookingSummary || {};
          return (
            <List.Item
              onClick={() =>
                navigate(`/dash/messages/${chat.bookingId}`, { state: chat })
              }
              style={{
                cursor: "pointer",
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
                background: "white",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar size={48}>{(summary.status || "").charAt(0)}</Avatar>
                }
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {summary.id || chat.bookingId}
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {last.createdAt
                          ? new Date(last.createdAt).toLocaleString()
                          : ""}
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge count={chat.unreadCount} />
                      )}
                    </div>
                  </div>
                }
                description={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        color: "#333",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: 420,
                      }}
                    >
                      {last.content || "No messages yet"}
                    </div>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default ChatsList;
