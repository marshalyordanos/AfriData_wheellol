// src/services/socketSetup.js
import React from "react";
import SocketService from "./socketService";
import { notification } from "antd";
import { BellOutlined } from "@ant-design/icons";
import {
  fetchNotifications,
  fetchUnreadNotifications,
} from "../views/notification/NotificationRedux";
import {
  fetchMessagesForBooking,
  upsertChat,
} from "../views/messages/MessageRedux";

export const initializeSockets = (dispatch, currentUserId) => {
  if (!currentUserId) return;

  // Refresh unread count on initialization
  dispatch(fetchUnreadNotifications(currentUserId));

  // Connect socket
  SocketService.connect(
    currentUserId,
    () => console.log("✅ Socket connected via SocketService"),
    () => console.log("❌ Socket disconnected via SocketService")
  );

  // Notification event
  const onNewNotification = (data) => {
    console.log("📩 New notification:", data);

    dispatch(fetchNotifications({ userid: currentUserId }));
    dispatch(fetchUnreadNotifications(currentUserId));

    notification.open({
      message: data.title || "New Notification",
      description: data.message || "You have a new notification",
      icon: React.createElement(BellOutlined, { style: { color: "#1890ff" } }),
      placement: "bottomRight",
      duration: 7,
    });
  };

  // New message event
  const onNewMessage = (data) => {
    try {
      console.log("💬 New message socket event:", data);

      if (data?.bookingId) {
        dispatch(fetchMessagesForBooking({ bookingId: data.bookingId }));
      }

      const lastMsgObj = {
        content:
          data?.content ||
          data?.message ||
          data?.text ||
          data?.lastMessage?.content ||
          data?.lastMessage?.message ||
          "",
        createdAt:
          data?.createdAt ||
          data?.sentAt ||
          data?.timestamp ||
          data?.lastMessage?.createdAt ||
          data?.lastMessage?.sentAt ||
          new Date().toISOString(),
      };

      const chatSummary = {
        bookingId: data?.bookingId,
        lastMessage: lastMsgObj,
        unreadCount: data?.unreadCount ?? 1,
        withUser: data?.withUser || null,
      };

      dispatch(upsertChat(chatSummary));
    } catch (err) {
      console.error("onNewMessage handler error:", err);
    }
  };

  // Update chat list event
  const onUpdateChatList = (data) => {
    try {
      console.log("update_chat_list socket event:", data);

      const lastMsgObj = {
        content:
          data?.content ||
          data?.message ||
          data?.text ||
          data?.lastMessage?.content ||
          data?.lastMessage?.message ||
          "",
        createdAt:
          data?.createdAt ||
          data?.sentAt ||
          data?.timestamp ||
          data?.lastMessage?.createdAt ||
          data?.lastMessage?.sentAt ||
          new Date().toISOString(),
      };

      const chatSummary = {
        bookingId: data?.bookingId,
        lastMessage: lastMsgObj,
        unreadCount: data?.unreadCount ?? 1,
        withUser: data?.withUser || null,
      };

      dispatch(upsertChat(chatSummary));
    } catch (err) {
      console.error("onUpdateChatList handler error:", err);
    }
  };

  // Register events
  SocketService.on("new_notification", onNewNotification);
  SocketService.on("new_message", onNewMessage);
  SocketService.on("update_chat_list", onUpdateChatList);

  // Cleanup function
  const cleanup = () => {
    SocketService.off("new_notification", onNewNotification);
    SocketService.off("new_message", onNewMessage);
    SocketService.off("update_chat_list", onUpdateChatList);
    SocketService.disconnect();
  };

  return cleanup;
};
