import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import ModelsService from "./CarModelsService";

export const searchBrands = createAsyncThunk(
  "models/searchModels",
  async (data, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } = getState().models.query; // Access state directly

      const res = await ModelsService.searchModels({
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

export const { updateModelsState } = modelsSlice.actions;

export default modelsSlice.reducer;
export const modelsSearchText = (state) => state.models.query.searchText;
export const modelsPage = (state) => state.models.query.page;
export const modelsLimit = (state) => state.models.query.limit;
export const modelsSort = (state) => state.models.query.sort;
export const modelsQuery = (state) => state.models.query;
