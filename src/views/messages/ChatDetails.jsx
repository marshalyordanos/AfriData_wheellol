import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessagesForBooking,
  sendMessage,
  selectMessagesForBooking,
  selectMessagesLoading,
} from "./MessageRedux";
import { Avatar, Input, Button, Spin } from "antd";
import { LoadingOutlined, CheckOutlined } from "@ant-design/icons";
const { TextArea } = Input;

const ChatDetails = () => {
  const { id } = useParams(); // bookingId
  const location = useLocation();
  const dispatch = useDispatch();
  const messages = useSelector((state) => selectMessagesForBooking(state, id));
  const loading = useSelector(selectMessagesLoading);
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId =
    currentUser?.id ||
    (JSON.parse(localStorage.getItem("user")) || {})?.id ||
    null;

  const [text, setText] = useState("");
  const [optimistic, setOptimistic] = useState([]);
  const messagesRef = React.useRef(null);
  const [sending, setSending] = useState(false);

  // get partner user from navigation state or messages
  const navFrom = location.state?.from || null;
  const navPartner = location.state?.chatPartner || null;
  const bookingSummary = location.state?.bookingSummary || null;

  const derivePartner = () => {
    if (navPartner) return navPartner;
    // look into messages to find a user object that's not the current user
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
      dispatch(fetchMessagesForBooking({ bookingId: id }));
    }
  }, [id]);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  console.log("Message info in chatState : ^^^^^^^^^^^^^^^^^", location.state);

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!currentUserId) return console.error("Missing sender ID");

    try {
      setSending(true);
      const senderId = currentUserId;
      const booking = location.state || {};
      let receiverId = booking.receiverId || null;

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
          {[...(messages || []), ...optimistic]?.map((m) => {
            const senderId =
              m.senderId || m.sender?._id || m.sender?.id || m.sender;
            const mine = String(senderId) === String(currentUserId);

            // prefer sender object profile, otherwise fallback
            const senderObj =
              m.sender || (mine ? currentUser : partnerUser) || {};
            const avatarSrc =
              senderObj.profilePhoto ||
              (mine ? currentUser?.profilePhoto : partnerUser?.profilePhoto);

            return (
              <div
                key={m._id || m.id || Math.random()}
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
                      background: mine ? "#3bb66e" : "#fff",
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
          placeholder="Write a message..."
          style={{ resize: "none", borderRadius: 8 }}
          disabled={sending}
        />
        <Button
          type="primary"
          onClick={handleSend}
          style={{ height: 40 }}
          loading={sending}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatDetails;
