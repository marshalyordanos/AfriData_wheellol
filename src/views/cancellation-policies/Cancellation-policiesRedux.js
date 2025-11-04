import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import service from "./Cancellation-policiesService";

// Thunks
export const fetchCancellationPolicies = createAsyncThunk(
  "cancellationPolicies/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await service.searchCancellationPolicies(params);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchCancellationPolicyById = createAsyncThunk(
  "cancellationPolicies/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await service.getCancellationPolicyById(id);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createCancellationPolicy = createAsyncThunk(
  "cancellationPolicies/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await service.createCancellationPolicy(payload);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateCancellationPolicy = createAsyncThunk(
  "cancellationPolicies/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await service.updateCancellationPolicy(data, id);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteCancellationPolicy = createAsyncThunk(
  "cancellationPolicies/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await service.deleteCancellationPolicy(id);
      return { id, res };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const slice = createSlice({
  name: "cancellationPolicies",
  initialState: {
    policies: [],
    policy: null,
    pagination: {},
    loading: false,
    error: null,
    query: { page: 1, limit: 10, searchText: "", filter: null },
  },
  reducers: {
    setQuery(state, action) {
      state.query = { ...state.query, ...action.payload };
    },
    clearPolicy(state) {
      state.policy = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCancellationPolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCancellationPolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.policies = action.payload.data || [];
        state.pagination = action.payload.pagination || {};
      })
      .addCase(fetchCancellationPolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchCancellationPolicyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCancellationPolicyById.fulfilled, (state, action) => {
        state.loading = false;
        state.policy = action.payload || null;
      })
      .addCase(fetchCancellationPolicyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createCancellationPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCancellationPolicy.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload)
          state.policies = [action.payload, ...state.policies];
      })
      .addCase(createCancellationPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateCancellationPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCancellationPolicy.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        if (updated) {
          state.policies = state.policies.map((p) =>
            p.id === updated.id ? updated : p
          );
          if (state.policy?.id === updated.id) state.policy = updated;
        }
      })
      .addCase(updateCancellationPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteCancellationPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCancellationPolicy.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload.id;
        state.policies = state.policies.filter(
          (p) => p.id !== deletedId && p._id !== deletedId
        );
        if (
          state.policy &&
          (state.policy.id === deletedId || state.policy._id === deletedId)
        )
          state.policy = null;
      })
      .addCase(deleteCancellationPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setQuery, clearPolicy } = slice.actions;

export const selectCancellationPolicies = (state) =>
  state.cancellationPolicies.policies;
export const selectCancellationPolicy = (state) =>
  state.cancellationPolicies.policy;
export const selectCancellationPagination = (state) =>
  state.cancellationPolicies.pagination;
export const selectCancellationLoading = (state) =>
  state.cancellationPolicies.loading;
export const selectCancellationError = (state) =>
  state.cancellationPolicies.error;

export default slice.reducer;
