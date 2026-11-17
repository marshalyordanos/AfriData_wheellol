import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import ModelsService from "./CarModelsService";

// 🔍 Async thunk: Fetch models with pagination, search, sort, etc.
export const searchModels = createAsyncThunk(
  "models/searchModels",
  async (data, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } = getState().models.query;

      const res = await ModelsService.searchModels({
        page,
        limit,
        searchText,
        sort,
        order,
      });

      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 🧩 Slice definition
export const modelsSlice = createSlice({
  name: "models",
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
    updateModelsState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

// 🎯 Actions
export const { updateModelsState } = modelsSlice.actions;

// 🏁 Reducer
export default modelsSlice.reducer;

// 🔍 Selectors
export const modelsSearchText = (state) => state.models.query.searchText;
export const modelsPage = (state) => state.models.query.page;
export const modelsLimit = (state) => state.models.query.limit;
export const modelsSort = (state) => state.models.query.sort;
export const modelsQuery = (state) => state.models.query;
