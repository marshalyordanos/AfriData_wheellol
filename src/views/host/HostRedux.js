import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import HostService from "./HostService";

export const searchHost = createAsyncThunk(
  "host/searchHost",
  async (data, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } = getState().host.query;
      const res = await HostService.searchHosts({
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

export const hostSlice = createSlice({
  name: "host",
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
    updateHostState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

export const { updateHostState } = hostSlice.actions;

export default hostSlice.reducer;
export const hostSearchText = (state) => state.host.query.searchText;
export const hostPage = (state) => state.host.query.page;
export const hostLimit = (state) => state.host.query.limit;
export const hostSort = (state) => state.host.query.sort;
export const hostQuery = (state) => state.host.query;
