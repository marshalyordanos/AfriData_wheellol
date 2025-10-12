import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import StaffService from "./StaffService";

export const searchStaff = createAsyncThunk(
  "staff/searchStaff",
  async (data, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } = getState().staff.query;
      const res = await StaffService.searchStaffs({
        page,
        limit,
        search: searchText,
        sort,
        order,
        data,
      });
      return res;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const staffSlice = createSlice({
  name: "staff",
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
    updateStaffState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

export const { updateStaffState } = staffSlice.actions;

export default staffSlice.reducer;
export const staffSearchText = (state) => state.staff.query.searchText;
export const staffPage = (state) => state.staff.query.page;
export const staffLimit = (state) => state.staff.query.limit;
export const staffSort = (state) => state.staff.query.sort;
export const staffQuery = (state) => state.staff.query;
