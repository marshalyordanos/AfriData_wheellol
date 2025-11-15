import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import PayoutService from "./PayoutService";

// Thunks
export const fetchPayouts = createAsyncThunk(
  "payout/fetchPayouts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await PayoutService.searchPayouts(params);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const releasePayout = createAsyncThunk(
  "payout/releasePayout",
  async ({ payoutId, data }, { rejectWithValue }) => {
    try {
      const res = await PayoutService.releasePayment(payoutId, data);
      return { payoutId, data: res };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const approvePayout = createAsyncThunk(
  "payout/approvePayout",
  async ({ payoutId, reason }, { rejectWithValue }) => {
    try {
      const res = await PayoutService.releasePayment(payoutId, {
        status: "APPROVED",
        reason: reason || undefined,
      });
      return { payoutId, data: res };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const rejectPayout = createAsyncThunk(
  "payout/rejectPayout",
  async ({ payoutId, reason }, { rejectWithValue }) => {
    try {
      const res = await PayoutService.releasePayment(payoutId, {
        status: "REJECTED",
        reason: reason || undefined,
      });
      return { payoutId, data: res };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

const initialState = {
  items: [],
  pagination: {},
  loading: false,
  error: null,
};

const payoutSlice = createSlice({
  name: "payout",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload.data)
          ? action.payload.data
          : [];
        state.pagination = action.payload.pagination || {};
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      })
      .addCase(releasePayout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(releasePayout.fulfilled, (state, action) => {
        state.loading = false;
        // update single payout in items if present
        const idx = state.items.findIndex(
          (i) =>
            i.id === action.payload.payoutId ||
            i._id === action.payload.payoutId
        );
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...action.payload.data };
        }
      })
      .addCase(releasePayout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      });
  },
});

export const { clearError } = payoutSlice.actions;
export default payoutSlice.reducer;

// Selectors
export const selectPayoutState = (s) => s.payout || initialState;
export const selectPayouts = (s) => selectPayoutState(s).items;
export const selectPayoutsLoading = (s) => selectPayoutState(s).loading;
export const selectPayoutsPagination = (s) => selectPayoutState(s).pagination;
