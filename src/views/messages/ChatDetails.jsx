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
  const messagesRef = React.useRef(null);
  const [sending, setSending] = useState(false);

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

  // const handleSend = async () => {
  //   if (!text.trim()) return;
  //   try {
  //     setSending(true);
  //     const senderId = currentUserId;
  //     // try location.state (chat) for receiverId;
  //     const chatState = location.state || {};
  //     console.log("chatState******************:-->", chatState);
  //     let receiverId = chatState.receiverId || null;

  //     // fallback: find last message sender that's not current user
  //     if (!receiverId && Array.isArray(messages) && messages.length > 0) {
  //       const lastOther = [...messages]
  //         .reverse()
  //         .find((m) => String(m.senderId) !== String(senderId));
  //       if (lastOther) receiverId = lastOther.senderId || null;
  //     }

  //     const payload = {
  //       bookingId: id,
  //       senderId: senderId,
  //       receiverId: receiverId,
  //       content: text,
  //     };

  //     await dispatch(sendMessage(payload));
  //     setText("");
  //     // refresh messages
  //     await dispatch(fetchMessagesForBooking({ bookingId: id }));
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     setSending(false);
  //   }
  // };
  const handleSend = async () => {
    if (!text.trim()) return;

    try {
      setSending(true);
      const senderId = currentUserId;
      const chatState = location.state || {};
      let receiverId = chatState.receiverId || null;

      if (!receiverId && Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];

        if (String(lastMessage.senderId) === String(senderId)) {
          receiverId = lastMessage.receiverId;
        } else {
          receiverId = lastMessage.senderId;
        }
      }

      if (!receiverId && chatState.bookingSummary?.otherUserId) {
        receiverId = chatState.bookingSummary.otherUserId;
      }

      const payload = {
        bookingId: id,
        senderId,
        receiverId,
        content: text.trim(),
      };

      await dispatch(sendMessage(payload));
      setText("");
      await dispatch(fetchMessagesForBooking({ bookingId: id }));
    } catch (e) {
      console.error(e);
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
        <h2 style={{ margin: 0 }}>Chat</h2>
        <div style={{ color: "#888", fontSize: 13 }}>
          {location.state?.bookingSummary?.id || `Booking ${id}`}
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
          {messages?.map((m) => {
            const mine =
              String(m.senderId || m.sender?._id || m.sender) ===
              String(currentUserId);
            return (
              <div
                key={m._id || m.id || Math.random()}
                style={{
                  display: "flex",
                  justifyContent: mine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    background: mine ? "#3bb66e" : "white",
                    color: mine ? "white" : "#222",
                    padding: "10px 14px",
                    borderRadius: 14,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                    wordBreak: "break-word",
                  }}
                >
                  <div style={{ fontSize: 14, lineHeight: 1.3 }}>
                    {m.content}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: mine ? "rgba(255,255,255,0.8)" : "#888",
                      marginTop: 6,
                      textAlign: "right",
                    }}
                  >
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
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
