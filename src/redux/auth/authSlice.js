import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../api/auth.service";

// Real THUNK for login
// export const login = createAsyncThunk(
//   "auth/login",
//   async (data, { rejectWithValue }) => {
//     try {
//       console.log(data);
//       const res = await authService.login(data?.email, data?.password);

//       // localStorage.setItem("user", JSON.stringify(res.data));

//       return res;
//     } catch (err) {
//       return rejectWithValue(err.response.data);
//     }
//   }
// );


// function for network delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// THIS IS THE Fake THUNK
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    console.log("SIMULATING LOGIN with:", credentials);
    await sleep(1000); 

    if (credentials.email === "admin1@gmail.com" && credentials.password === "1234") {
      console.log("Simulating SUCCESSFUL login response");
      const fakeSuccessResponse = {
        user: { id: 1, name: "Admin User", email: "admin1@gmail.com", role: "admin" },
        accessToken: "fake-access-token-string-123",
        refreshToken: "fake-refresh-token-string-abc",
      };
      
      localStorage.setItem("user", JSON.stringify(fakeSuccessResponse));
      
      return fakeSuccessResponse;
    } else {
      console.log("failed login response");
      const fakeErrorResponse = {
        message: "Invalid credentials. Please try again.",
      };
      return rejectWithValue(fakeErrorResponse);
    }
  }
);



export const authSlice = createSlice({
  name: "auth",
  initialState: {
    status: "idle",
    user: null,
    err: null
  },
  reducers: {
    setCredential: (state, action) => {
      const { user } = action.payload;
      state.user = user;
    },
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.status = 'idle';
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
      state.err = action.payload?.message || 'An unknown error occurred';
    })
},
});

// Action creators are generated for each case reducer function
export const { setCredential, logout} = authSlice.actions;

export default authSlice.reducer;
export const selectCurrentUser = (state) => state.auth.user;
