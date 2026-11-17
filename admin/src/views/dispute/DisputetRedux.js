import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import DisputeService from "./DisputeService";

// --- Thunks ---
export const fetchDisputesThunk = createAsyncThunk(
  "disputes/fetchDisputes",
  async (params, { rejectWithValue }) => {
    try {
      const data = await DisputeService.searchDisputes(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const reviewDisputeThunk = createAsyncThunk(
  "disputes/review",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await DisputeService.reviewDispute(payload, id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const resolveDisputeThunk = createAsyncThunk(
  "disputes/resolve",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await DisputeService.resolveDispute(payload, id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const rejectDisputeThunk = createAsyncThunk(
  "disputes/reject",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await DisputeService.rejectDispute(payload, id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// --- Slice ---
const disputeSlice = createSlice({
  name: "dispute",
  initialState: {
    disputes: [],
    query: { page: 1, limit: 10, searchText: "", sort: "", order: "" },
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    updateDisputeState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDisputesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDisputesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes = action.payload.data || [];
        state.total = action.payload.pagination?.total || 0;
      })
      .addCase(fetchDisputesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(reviewDisputeThunk.fulfilled, (state, action) => {
        // update single dispute in list if present
        const updated = action.payload?.data || action.payload || null;
        if (updated) {
          state.disputes = state.disputes.map((d) =>
            d.id === updated.id ? updated : d
          );
        }
      })
      .addCase(resolveDisputeThunk.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload || null;
        if (updated) {
          state.disputes = state.disputes.map((d) =>
            d.id === updated.id ? updated : d
          );
        }
      })
      .addCase(rejectDisputeThunk.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload || null;
        if (updated) {
          state.disputes = state.disputes.map((d) =>
            d.id === updated.id ? updated : d
          );
        }
      });
  },
});

export const { updateDisputeState } = disputeSlice.actions;
export const disputeQuery = (state) => state.dispute.query;
export const disputeList = (state) => state.dispute.disputes;
export default disputeSlice.reducer;
