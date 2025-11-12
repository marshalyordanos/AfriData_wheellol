import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import MessagesService from "./MessagesService";

// Fetch chat list for a user
export const fetchChatsForUser = createAsyncThunk(
  "messages/fetchChatsForUser",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await MessagesService.getAllMessageChatsOfAUser(userId);
      return res; // whole response
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Fetch messages for a booking (chat)
export const fetchMessagesForBooking = createAsyncThunk(
  "messages/fetchMessagesForBooking",
  async ({ bookingId, page = 1 } = {}, { rejectWithValue }) => {
    try {
      const res = await MessagesService.getAllMessagesOfABooking(
        bookingId,
        page
      );
      return { bookingId, page, ...res };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await MessagesService.sendMessage(payload);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "messages/markAsRead",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await MessagesService.markAsRead(payload);
      return { payload, res };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    chats: [],
    chatsLoading: false,
    messages: {}, // bookingId -> { items: [], pagination }
    messagesLoading: false,
    error: null,
  },
  reducers: {
    // Upsert a single chat summary into the chats array without toggling loading
    upsertChat: (state, action) => {
      const chat = action.payload || {};
      const bookingId =
        chat.bookingId || chat.bookingId || chat.id || chat.bookingId;
      if (!bookingId) return;

      const idx = state.chats.findIndex(
        (c) => String(c.bookingId) === String(bookingId)
      );
      if (idx > -1) {
        // merge lastMessage and unreadCount and withUser
        state.chats[idx] = {
          ...state.chats[idx],
          ...chat,
          lastMessage: chat.lastMessage || state.chats[idx].lastMessage,
          unreadCount:
            typeof chat.unreadCount === "number"
              ? chat.unreadCount
              : state.chats[idx].unreadCount,
          withUser: chat.withUser || state.chats[idx].withUser,
        };
        // move updated chat to top
        const updated = state.chats.splice(idx, 1)[0];
        state.chats.unshift(updated);
      } else {
        // insert new chat at the top
        state.chats.unshift(chat);
      }
    },
    // Insert or update a single message into a booking's messages list
    upsertMessage: (state, action) => {
      const msg = action.payload || {};
      const bookingId = msg.bookingId || msg.booking_id || msg.booking || null;
      if (!bookingId) return;

      state.messages[bookingId] = state.messages[bookingId] || {
        items: [],
        pagination: {},
      };
      const items = state.messages[bookingId].items || [];
      const exists = items.find(
        (m) => String(m.id || m._id) === String(msg.id || msg._id)
      );
      if (!exists) {
        // append message
        state.messages[bookingId].items = [...items, msg];
      } else {
        // update existing
        state.messages[bookingId].items = items.map((m) =>
          String(m.id || m._id) === String(msg.id || msg._id)
            ? { ...m, ...msg }
            : m
        );
      }
    },
    clearMessagesState: (state) => {
      state.chats = [];
      state.messages = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatsForUser.pending, (state) => {
        state.chatsLoading = true;
      })
      .addCase(fetchChatsForUser.fulfilled, (state, action) => {
        state.chatsLoading = false;
        state.chats = action.payload?.data || [];
      })
      .addCase(fetchChatsForUser.rejected, (state, action) => {
        state.chatsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessagesForBooking.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(fetchMessagesForBooking.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const bookingId = action.payload.bookingId;
        const page = action.payload.page || 1;
        const data = action.payload?.data || [];
        const pagination = action.payload?.pagination || {};

        state.messages[bookingId] = state.messages[bookingId] || {
          items: [],
          pagination: {},
        };

        if (page && page > 1) {
          // prepend older messages (assuming API returns older messages for next pages)
          const existingIds = new Set(
            (state.messages[bookingId].items || []).map((m) => m.id || m._id)
          );
          const toAdd = data.filter((d) => !existingIds.has(d.id || d._id));
          state.messages[bookingId].items = [
            ...toAdd,
            ...(state.messages[bookingId].items || []),
          ];
        } else {
          state.messages[bookingId].items = data;
        }

        state.messages[bookingId].pagination = pagination;
      })
      .addCase(fetchMessagesForBooking.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // server returns the created message in action.payload.data or action.payload
        const msg = action.payload?.data || action.payload;
        if (msg && msg.bookingId) {
          const b = msg.bookingId;
          state.messages[b] = state.messages[b] || {
            items: [],
            pagination: {},
          };
          state.messages[b].items = [...state.messages[b].items, msg];
        }
      });
    builder.addCase(markMessagesAsRead.fulfilled, (state, action) => {
      // payload contains { bookingId, userId } typically
      const { payload } = action.payload || {};
      const bookingId = payload?.bookingId || payload?.booking || null;
      if (!bookingId) return;

      // mark chat unreadCount to 0 in chats
      const idx = state.chats.findIndex(
        (c) => String(c.bookingId) === String(bookingId)
      );
      if (idx > -1) {
        state.chats[idx] = { ...state.chats[idx], unreadCount: 0 };
      }

      // update messages in that booking to mark read
      if (state.messages[bookingId]?.items) {
        state.messages[bookingId].items = state.messages[bookingId].items.map(
          (m) => ({ ...m, isRead: true })
        );
      }
    });
  },
});

export const { clearMessagesState } = messagesSlice.actions;
export const { upsertChat, upsertMessage } = messagesSlice.actions;

export default messagesSlice.reducer;

export const selectChats = (state) => state.messages.chats;
export const selectChatsLoading = (state) => state.messages.chatsLoading;
export const selectMessagesForBooking = (state, bookingId) =>
  state.messages.messages[bookingId]?.items || [];
export const selectMessagesLoading = (state) => state.messages.messagesLoading;
