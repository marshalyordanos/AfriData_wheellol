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
  async ({ bookingId }, { rejectWithValue }) => {
    try {
      const res = await MessagesService.getAllMessagesOfABooking(bookingId);
      return { bookingId, ...res };
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
        state.messages[bookingId] = {
          items: action.payload?.data || [],
          pagination: action.payload?.pagination || {},
        };
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
  },
});

export const { clearMessagesState } = messagesSlice.actions;
export const { upsertChat } = messagesSlice.actions;

export default messagesSlice.reducer;

export const selectChats = (state) => state.messages.chats;
export const selectChatsLoading = (state) => state.messages.chatsLoading;
export const selectMessagesForBooking = (state, bookingId) =>
  state.messages.messages[bookingId]?.items || [];
export const selectMessagesLoading = (state) => state.messages.messagesLoading;
