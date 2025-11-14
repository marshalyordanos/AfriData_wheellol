import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessagesForBooking,
  sendMessage,
  selectMessagesForBooking,
  selectMessagesLoading,
  upsertMessage,
} from "./MessageRedux";
import { Avatar, Input, Button, Spin } from "antd";
import { LoadingOutlined, CheckOutlined } from "@ant-design/icons";
import socketService from "../../services/socketService";

const { TextArea } = Input;

const ChatDetails = () => {
  const { id } = useParams(); // bookingId
  const { connected } = useSelector((state) => state.socket);

  const location = useLocation();
  const dispatch = useDispatch();
  const messages = useSelector((state) => selectMessagesForBooking(state, id));
  const loading = useSelector(selectMessagesLoading);
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId =
    currentUser?.id ||
    (JSON.parse(localStorage.getItem("user")) || {})?.id ||
    null;

  const isHostUser = (user) => {
    if (!user) return false;
    const u = user || JSON.parse(localStorage.getItem("user")) || {};
    const roleCandidates = [u.role, u?.role?.name];
    return roleCandidates.some((r) => {
      if (!r) return false;
      const v = String(typeof r === "object" ? r : r).toLowerCase();
      return v.includes("host");
    });
  };

  const canSendMessage = isHostUser(currentUser);

  const [text, setText] = useState("");
  const [optimistic, setOptimistic] = useState([]);
  const messagesRef = React.useRef(null);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const requestedPagesRef = React.useRef(new Set());
  const [sending, setSending] = useState(false);

  // get partner user from navigation state or messages
  const navFrom = location.state?.from || null;
  const chatPartner = location.state?.chatPartner || null;
  const bookingSummary = location.state?.bookingSummary || null;

  const derivePartner = () => {
    if (chatPartner) return chatPartner;
    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        // prefer sender/receiver as objects
        const s = m.sender || (m.senderId && null);
        const r = m.receiver || (m.receiverId && null);
        if (s && String(s.id || s) !== String(currentUserId)) return s;
        if (r && String(r.id || r) !== String(currentUserId)) return r;
      }
    }
    return null;
  };

  const partnerUser = derivePartner();
  const partnerName =
    (partnerUser &&
      (partnerUser.fullName ||
        `${partnerUser.firstName || ""} ${
          partnerUser.lastName || ""
        }`.trim())) ||
    bookingSummary?.id ||
    `Booking ${id}`;

  useEffect(() => {
    if (id) {
      setPage(1);
      setHasMore(true);
      requestedPagesRef.current = new Set([1]);
      dispatch(fetchMessagesForBooking({ bookingId: id, page: 1 })).then(
        (res) => {
          const total =
            res.payload?.pagination?.total ?? (res.payload?.data || []).length;
          setHasMore((res.payload?.data || []).length < total);
        }
      );
    }
  }, [id]);

  //SOCKET FOR Messages
  useEffect(() => {
    if (!connected || !currentUserId || !id) return;

    const onNewMessage = (payload) => {
      try {
        const data = payload?.data || payload || {};

        if (data.senderId != currentUserId) {
          console.log("💬 New message socket event (ChatDetails):", data);
          if (String(data.bookingId) !== String(id)) return; // ignore other bookings

          // Insert or update the message into the store
          const msg = {
            id: data.id || data._id,
            bookingId: data.bookingId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content || data.message || "",
            isRead: data.isRead ?? false,
            createdAt: data.createdAt || new Date().toISOString(),
            sender: data.sender || data.from || null,
          };

          dispatch(upsertMessage(msg));

          // If the user is viewing this booking, mark optimistic placeholders gone
          setOptimistic((prev) =>
            prev.filter((m) => m.content !== msg.content)
          );
        }
      } catch (err) {
        console.error("onNewMessage handler error:", err);
      }
    };

    socketService.joinBooking(id);
    socketService.on("new_message", onNewMessage);

    return () => {
      socketService.off("new_message");
      socketService.off("join_booking");
    };
  }, [connected, currentUserId, id]);

  // prepare messages in ascending order (oldest -> newest)
  const sortedMessages = React.useMemo(() => {
    const src = Array.isArray(messages) ? [...messages] : [];
    src.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime() || 0;
      const tb = new Date(b.createdAt).getTime() || 0;
      return ta - tb;
    });
    // optimistic messages should appear after server messages (newest at bottom)
    const opts = Array.isArray(optimistic) ? [...optimistic] : [];
    return [...src, ...opts];
  }, [messages, optimistic]);

  // auto-scroll to bottom when visible message list grows or optimistic changes
  useEffect(() => {
    if (messagesRef.current) {
      // scroll to bottom to show newest messages
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [sortedMessages.length]);

  // load previous messages when scrolling to top
  const handleScroll = async (e) => {
    try {
      const target = e.target;
      if (!target) return;

      if (target.scrollTop <= 10 && !isLoadingMore && hasMore) {
        const nextPage = page + 1;
        if (requestedPagesRef.current.has(nextPage)) return;
        requestedPagesRef.current.add(nextPage);
        setIsLoadingMore(true);
        // capture current scroll height to preserve position after prepend
        const prevScrollHeight = messagesRef.current?.scrollHeight || 0;
        try {
          const res = await dispatch(
            fetchMessagesForBooking({ bookingId: id, page: nextPage })
          );
          const data = res.payload?.data || [];
          const total =
            res.payload?.pagination?.total ?? messages.length + data.length;
          // update hasMore
          setHasMore(messages.length + (data.length || 0) < total);
          if ((data.length || 0) > 0) setPage(nextPage);
          setTimeout(() => {
            const newScrollHeight = messagesRef.current?.scrollHeight || 0;
            const delta = newScrollHeight - prevScrollHeight;
            if (messagesRef.current) messagesRef.current.scrollTop = delta + 20;
          }, 50);
        } catch (err) {
          console.error("Failed to load older messages", err);
        } finally {
          setIsLoadingMore(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // console.log("Message info in chatState : ^^^^^^^^^^^^^^^^^", location.state);

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!currentUserId) return console.error("Missing sender ID");

    try {
      setSending(true);
      const senderId = currentUserId;
      const booking = location.state || {};
      let receiverId = chatPartner?.id || null;

      // Determine receiver
      if (!receiverId && booking?.host?.id && booking?.guest?.id) {
        receiverId =
          String(booking.host.id) === String(senderId)
            ? booking.guest.id
            : booking.host.id;
      }

      if (!receiverId && Array.isArray(messages) && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        receiverId =
          String(lastMsg.senderId) === String(senderId)
            ? lastMsg.receiverId
            : lastMsg.senderId;
      }

      if (!receiverId)
        return console.error("Receiver ID could not be determined");

      const payload = {
        bookingId: id,
        senderId,
        receiverId,
        content: text.trim(),
      };

      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        id: tempId,
        bookingId: id,
        senderId,
        receiverId,
        content: text.trim(),
        createdAt: new Date().toISOString(),
        optimistic: true,
      };

      setOptimistic((prev) => [...prev, tempMsg]);
      setText("");

      const result = await dispatch(sendMessage(payload));

      const serverMsg = result?.payload?.data ?? result?.payload ?? null;

      if (serverMsg) {
        setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (sending) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
        }}
      >
        <Spin size="large" />
      </div>
    );

  return (
    <div
      style={{
        padding: 20,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {partnerUser ? (
          <Avatar size={44} src={partnerUser.profilePhoto || undefined}>
            {(partnerUser.fullName || partnerUser.firstName || "").charAt(0)}
          </Avatar>
        ) : (
          <Avatar size={44}>{(bookingSummary?.id || "B").charAt(0)}</Avatar>
        )}
        <div>
          <h2 style={{ margin: 0 }}>{partnerName}</h2>
          {bookingSummary?.id && (
            <div style={{ color: "#666", fontSize: 13 }}>
              Booking {bookingSummary.id}
            </div>
          )}
        </div>
      </div>

      <div
        ref={messagesRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          background: "#f5f7fa",
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        {(!messages || messages.length === 0) && (
          <div style={{ textAlign: "center", color: "#888" }}>
            No messages yet
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedMessages.map((m) => {
            const senderId =
              m.senderId || m.sender?._id || m.sender?.id || m.sender;
            const mine = String(senderId) === String(currentUserId);

            const senderObj =
              m.sender || (mine ? currentUser : partnerUser) || {};
            const avatarSrc =
              senderObj.profilePhoto ||
              (mine ? currentUser?.profilePhoto : partnerUser?.profilePhoto);

            return (
              <div
                key={
                  m._id || m.id || `${m.bookingId || ""}-${m.createdAt || ""}`
                }
                style={{
                  display: "flex",
                  justifyContent: mine ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {/* left: partner avatar for incoming */}
                {!mine && (
                  <div style={{ marginRight: 8 }}>
                    <Avatar size={28} src={avatarSrc} />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: mine ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      background: mine
                        ? "var(--color-primary)"
                        : "var(--color-secondary)",
                      color: mine ? "#fff" : "#111",
                      padding: "10px 14px",
                      borderRadius: 12,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      wordBreak: "break-word",
                    }}
                  >
                    <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                      {m.content}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div>{new Date(m.createdAt).toLocaleString()}</div>
                    {mine && m.optimistic && (
                      <LoadingOutlined style={{ color: "#bbb" }} />
                    )}
                    {mine && !m.optimistic && (
                      <CheckOutlined style={{ color: "#bbb" }} />
                    )}
                  </div>
                </div>

                {/* right: current user avatar for outgoing */}
                {mine && (
                  <div style={{ marginLeft: 8 }}>
                    <Avatar size={28} src={avatarSrc} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={
            canSendMessage
              ? "Write a message..."
              : "Only host and guest can send messages"
          }
          style={{ resize: "none", borderRadius: 8 }}
          disabled={sending || !canSendMessage}
        />
        <Button
          type="primary"
          onClick={handleSend}
          disabled={!canSendMessage}
          style={{
            height: 40,
            color: "white",
            backgroundColor: canSendMessage ? "var(--color-primary)" : "#ccc",
            borderColor: canSendMessage ? "var(--color-primary)" : "#ccc",
            cursor: canSendMessage ? "pointer" : "not-allowed",
          }}
          loading={sending}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatDetails;
