// In-app notifications (admin). Real-time items arrive via the socket
// ("new_notification") and are added with notificationReceived().
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import NotificationService from "./NotificationService";

// Exported names are kept from the old version so existing callers still work.
// The old `userid` arguments are ignored — the API uses the login token.
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async ({ page = 1, pageSize = 20, unread = false } = {}, { rejectWithValue }) => {
    try {
      return await NotificationService.list({ page, pageSize, unread });
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchUnreadNotifications = createAsyncThunk(
  "notifications/fetchUnread",
  async (_, { rejectWithValue }) => {
    try {
      return await NotificationService.unreadCount();
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (arg, { rejectWithValue }) => {
    const id = typeof arg === "string" ? arg : arg?.id;
    try {
      const res = await NotificationService.markRead(id);
      return { id, unreadCount: res?.unreadCount };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAll",
  async (_, { rejectWithValue }) => {
    try {
      return await NotificationService.markAllRead();
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    total: 0,
    page: 1,
    unreadCount: 0,
    filter: "all", // "all" | "unread"
    loading: false,
    error: null,
  },
  reducers: {
    notificationReceived: (state, action) => {
      const n = action.payload;
      if (!n?.id || state.items.some((i) => i.id === n.id)) return;
      state.items.unshift({ isRead: false, createdAt: new Date().toISOString(), ...n });
      state.total += 1;
      if (!n.isRead) state.unreadCount += 1;
    },
    setNotificationFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const page = action.meta?.arg?.page || 1;
        const data = action.payload.data || [];
        if (page > 1) {
          const ids = new Set(state.items.map((i) => i.id));
          state.items = state.items.concat(data.filter((d) => !ids.has(d.id)));
        } else {
          state.items = data;
        }
        state.page = page;
        state.total = action.payload.pagination?.total ?? state.items.length;
        state.unreadCount = action.payload.unreadCount ?? state.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        state.unreadCount = Number(action.payload) || 0;
      })
      .addCase(markNotificationRead.pending, (state, action) => {
        // optimistic
        const id = typeof action.meta.arg === "string" ? action.meta.arg : action.meta.arg?.id;
        const item = state.items.find((i) => i.id === id);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        if (typeof action.payload?.unreadCount === "number") state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.items = state.items.map((i) => ({ ...i, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const { notificationReceived, setNotificationFilter } = notificationSlice.actions;
export const selectNotifications = (state) => state.notifications?.items || [];
export const selectUnreadCount = (state) => state.notifications?.unreadCount || 0;
export default notificationSlice.reducer;
