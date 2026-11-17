import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import profileService from "./ProfileService";

export const fetchProfile = createAsyncThunk(
  "profile/fetch",
  async (id, { rejectWithValue }) => {
    try {
      const data = await profileService.getUserProfileById(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await profileService.updateProfile(id, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    item: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.item = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.item = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default profileSlice.reducer;
