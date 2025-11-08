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
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated && updated.id) {
          state.items = state.items.map((it) =>
            it.id === updated.id ? updated : it
          );
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        // payload may be list or status; mark all local items as read
        state.items = state.items.map((it) => ({ ...it, read: true }));
      });
  },
});

export const selectNotifications = (state) => state.notifications?.items || [];
export const selectUnreadCount = (state) =>
  (state.notifications?.items || []).filter((n) => !n.read).length;
export default notificationSlice.reducer;
