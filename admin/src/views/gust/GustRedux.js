import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import GustService from "./GustService";

export const searchGust = createAsyncThunk(
  "gust/searchGust",
  async (data, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } = getState().gust.query;
      const res = await GustService.searchGusts({
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

export const gustSlice = createSlice({
  name: "gust",
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
    updateGustState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

export const { updateGustState } = gustSlice.actions;

export default gustSlice.reducer;
export const gustSearchText = (state) => state.gust.query.searchText;
export const gustPage = (state) => state.gust.query.page;
export const gustLimit = (state) => state.gust.query.limit;
export const gustSort = (state) => state.gust.query.sort;
export const gustQuery = (state) => state.gust.query;
