import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import UserService from "./UserService";

export const searchUser = createAsyncThunk(
  "user/searchUser",
  async (data, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } = getState().user.query; // Access state directly

      const res = await UserService.searchUse({
        page,
        limit,
        searchText,
        sort,
        order,
        data,
      });
      console.log("USERRRRRRRRRRRRRR_________________ data:", res);

      return res;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState: {
    query: {
      searchText: "",
      page: 1,
      limit: 5,
      sort: "",
      order: "",
    },
  },
  reducers: {
    updateUserState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

export const { updateUserState } = userSlice.actions;

export default userSlice.reducer;
export const userSearchText = (state) => state.user.query.searchText;
export const userPage = (state) => state.user.query.page;
export const userLimit = (state) => state.user.query.limit;
export const userSort = (state) => state.user.query.sort;
export const userQuery = (state) => state.user.query;
