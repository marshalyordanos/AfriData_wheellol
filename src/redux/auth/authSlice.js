import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../api/auth.service";

export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      console.log(data);
      const res = await authService.login(data?.phone, data?.password);
      // Store tokens at root level for TokenService compatibility
      if (res && res.tokens) {
        const userToStore = {
          ...res.user,
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
        };
        localStorage.setItem("user", JSON.stringify(userToStore));
      }
      return res;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);
export const authSlice = createSlice({
  name: "auth",
  initialState: {
    status: "idle",
    user: null,
    err: null,
    bookingSummary: {},
    carSummary: {},
    userSummary: {},
    paymentSummary: {},
  },
  reducers: {
    setCredential: (state, action) => {
      const { user } = action.payload;
      state.user = user;
    },
    setSummary: (state, action) => {
      const { bookingSummary, paymentSummary, carSummary, userSummary } =
        action.payload;
      state.bookingSummary = bookingSummary;
      state.paymentSummary = paymentSummary;
      state.carSummary = carSummary;
      state.userSummary = userSummary;
    },
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.status = "idle";
      state.err = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Cases for LOGIN
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.err = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "success";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.err = action.payload?.message || "An unknown error occurred";
      });
  },
});

// Action creators are generated for each case reducer function
export const { setCredential, logout, setSummary } = authSlice.actions;

export default authSlice.reducer;
export const selectCurrentUser = (state) => state.auth.user;
export const selectbookingSummary = (state) => state.auth.bookingSummary;
export const selectpaymentSummary = (state) => state.auth.paymentSummary;
export const selectcarSummary = (state) => state.auth.carSummary;
export const selectuserSummary = (state) => state.auth.userSummary;
