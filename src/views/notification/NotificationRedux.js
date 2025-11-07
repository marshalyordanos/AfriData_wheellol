import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import NotificationService from "./NotificationService";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await NotificationService.getNotifications(params);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchUnreadNotifications = createAsyncThunk(
  "notifications/fetchUnread",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await NotificationService.unReadNotifications(userId);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      const res = await NotificationService.markAsRead(id, userId);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAll",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await NotificationService.markAllRead(userId);
      return res;
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
    unreadCount: 0,
    query: { page: 1, limit: 20 },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.pagination?.total || state.items.length;
      })
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
       
        const payload = action.payload;
        let count = 0;
        if (payload == null) {
          count = 0;
        } else if (typeof payload === "number") {
          count = payload;
        } else if (typeof payload === "object") {
          if (typeof payload.count === "number") count = payload.count;
          else if (payload.data && typeof payload.data.count === "number")
            count = payload.data.count;
          else if (typeof payload.data === "number") count = payload.data;
          else if (
            typeof payload.data === "object" &&
            typeof payload.data.total === "number"
          )
            count = payload.data.total;
        }
        state.unreadCount = count;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          const prev = state.items.find((it) => it.id === updated.id);
          state.items = state.items.map((it) =>
            it.id === updated.id ? updated : it
          );
          // if the previous item existed and was unread but now is read, decrement unreadCount
          if (prev && !prev.isRead && updated.isRead) {
            state.unreadCount = Math.max(0, (state.unreadCount || 0) - 1);
          }
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        state.items = state.items.map((it) => ({ ...it, read: true }));
        state.unreadCount = 0;
      });
  },
});

export const selectNotifications = (state) => state.notifications?.items || [];
export const selectUnreadCount = (state) =>
  state.notifications?.unreadCount ??
  (state.notifications?.items || []).filter((n) => !n.read).length;
export default notificationSlice.reducer;
