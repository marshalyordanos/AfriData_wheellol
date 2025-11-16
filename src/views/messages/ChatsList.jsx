import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchChatsForUser,
  selectChats,
  selectChatsLoading,
  upsertChat,
  markMessagesAsRead,
} from "./MessageRedux";
import { List, Avatar, Badge, Spin, Input } from "antd";
import MessagesService from "./MessagesService";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import socketService from "../../services/socketService";

const ChatsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chats = useSelector(selectChats);
  const loading = useSelector(selectChatsLoading);
  const currentUser = useSelector(selectCurrentUser);
  const { connected } = useSelector((state) => state.socket);

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
  const [searchChats, setSearchChats] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const requestedPagesRef = useRef(new Set());
  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const restoreScrollRef = useRef(false);

  /* -------------------------------------------
   * SOCKET LISTENERS
  --------------------------------------------*/
  useEffect(() => {
    if (!connected || !userId) return;

    const onUpdateChatList = (data) => {
      try {
        const lastMsgObj = {
          content: data?.content || data?.lastMessage?.content || "",
          createdAt:
            data?.createdAt ||
            data?.lastMessage?.createdAt ||
            new Date().toISOString(),
        };

        const chatSummary = {
          bookingId: data?.bookingId,
          lastMessage: lastMsgObj,
          unreadCount: data?.unreadCount ?? 1,
          withUser: data?.withUser || null,
          bookingSummary: data?.bookingSummary || null,
        };

        dispatch(upsertChat(chatSummary));
      } catch (err) {
        console.error("onUpdateChatList handler error:", err);
      }
    };

    socketService.on("update_chat_list", onUpdateChatList);

    return () => {
      socketService.off("update_chat_list", onUpdateChatList);
    };
  }, [connected]);

  useEffect(() => {
    if (!userId) return;

    requestedPagesRef.current.add(1);
    dispatch(fetchChatsForUser({ userId, page: 1 }));

    MessagesService.getAllUnreadMessagesOfAUser(userId)
      .then((res) => {
        const count = res?.data?.count ?? 0;
        setUnreadCount(Number(count));
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!chats) return;
    if (chats.length === 0) setHasMore(false);
  }, [chats]);

  useEffect(() => {
    try {
      const total = (chats || []).reduce((acc, c) => {
        const v = Number(c?.unreadCount || 0);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0);
      setUnreadCount(total);
    } catch (err) {
      // ignore
    }
  }, [chats]);

  const loadNextPage = async (next) => {
    if (!userId || !hasMore) return;

    setIsLoadingMore(true);

    // Save scroll height before new items come
    const container = containerRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
      restoreScrollRef.current = true;
    }

    try {
      const res = await dispatch(fetchChatsForUser({ userId, page: next }));
      const data = res.payload?.data || [];
      const total =
        res.payload?.pagination?.total ?? chats.length + data.length;

      if (data.length > 0) setPage(next);
      setHasMore(chats.length + data.length < total);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useLayoutEffect(() => {
    if (!restoreScrollRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const newHeight = container.scrollHeight;
    const oldHeight = prevScrollHeightRef.current;

    container.scrollTop += newHeight - oldHeight;

    restoreScrollRef.current = false;
  }, [chats]);

  const handleScroll = (e) => {
    const target = e.target;

    const distanceFromBottom =
      target.scrollHeight - (target.scrollTop + target.clientHeight);

    if (distanceFromBottom < 150 && !isLoadingMore && hasMore) {
      const next = page + 1;
      if (!requestedPagesRef.current.has(next)) {
        requestedPagesRef.current.add(next);
        loadNextPage(next);
      }
    }
  };

  const displayedChats = query
    ? Array.isArray(searchChats)
      ? searchChats
      : []
    : chats || [];

  if (loading && (!chats || chats.length === 0))
    return (
      <div
        style={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );

  return (
    <div>
      <div className="flex md:flex-row flex-col justify-between items-start md:items-end p-6">
        <div className="flex flex-col md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Chats</h1>
          <div className="flex gap-3 flex-wrap items-center">
            <Input
              placeholder="Search by booking or message"
              value={query}
              onChange={(e) => {
                const q = e.target.value;
                setQuery(q);
                // clear previous timer
                if (searchTimerRef.current)
                  clearTimeout(searchTimerRef.current);

                // no query -> clear results and stop loading
                if (!q) {
                  setSearchLoading(false);
                  setSearchChats(null);
                  return;
                }

                // start loading indicator (optimistic)
                setSearchLoading(true);

                // debounce backend search
                searchTimerRef.current = setTimeout(async () => {
                  if (!userId) {
                    setSearchLoading(false);
                    return;
                  }
                  try {
                    const res = await MessagesService.searchChatPartners({
                      userid: userId,
                      searchText: q,
                    });
                    setSearchChats(Array.isArray(res.data) ? res.data : []);
                  } catch (err) {
                    console.error("searchChatPartners failed", err);
                    setSearchChats([]);
                  } finally {
                    setSearchLoading(false);
                  }
                }, 450);
              }}
              allowClear
              style={{ borderRadius: "0px 0px 0px 0px" }}
              className="drop-shadow-sm rounded-r py-2"
            />
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ maxHeight: "65vh", overflowY: "auto" }}
      >
        <List
          itemLayout="horizontal"
          dataSource={displayedChats}
          loading={searchLoading}
          renderItem={(chat) => {
            const last = chat.lastMessage || {};
            const summary = chat.bookingSummary || {};
            return (
              <List.Item
                style={{
                  cursor: "pointer",
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 8,
                  background: "white",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
                onClick={() => {
                  dispatch(
                    markMessagesAsRead({
                      bookingId: chat.bookingId,
                      userId,
                    })
                  );

                  navigate(`/dash/messages/${chat.bookingId}`, {
                    state: {
                      from: "chatsList",
                      chatPartner: chat.withUser,
                    },
                  });
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      src={chat.withUser?.profilePhoto || undefined}
                    >
                      {chat.withUser?.fullName?.charAt(0)}
                    </Avatar>
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <b>{chat.withUser?.fullName || chat.bookingId}</b>
                      <span style={{ fontSize: 12, color: "#666" }}>
                        {last.createdAt
                          ? new Date(last.createdAt).toLocaleString()
                          : ""}
                      </span>

                      {chat.unreadCount > 0 && (
                        <Badge count={chat.unreadCount} />
                      )}
                    </div>
                  }
                  description={
                    <span style={{ color: "#444" }}>
                      {last.content || "No messages yet"}
                    </span>
                  }
                />
              </List.Item>
            );
          }}
        />

        {isLoadingMore && (
          <div style={{ textAlign: "center", padding: 12 }}>
            <Spin />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsList;
