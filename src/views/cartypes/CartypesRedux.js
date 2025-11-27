import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import CartypesService from "./CartypesService";

export const searchCartypes = createAsyncThunk(
  "cartypes/searchCartypes",
  async (data, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } =
        getState().cartypes.query; // Access state directly

      const res = await CartypesService.searchCartype({
        page,
        limit,
        searchText,
        sort,
        order,
      });

      return res;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const cartypesSlice = createSlice({
  name: "cartypes",
  initialState: {
    query: {
      searchText: "",
      page: 1,
      limit: 10,
      sort: "",
      order: "",
    },
  },
  reducers: {
    updateCartypesState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

export const { updateCartypesState } = cartypesSlice.actions;

export default cartypesSlice.reducer;
export const cartypesSearchText = (state) => state.cartypes.query.searchText;
export const cartypesPage = (state) => state.cartypes.query.page;
export const cartypesLimit = (state) => state.cartypes.query.limit;
export const cartypesSort = (state) => state.cartypes.query.sort;
export const cartypesQuery = (state) => state.cartypes.query;
