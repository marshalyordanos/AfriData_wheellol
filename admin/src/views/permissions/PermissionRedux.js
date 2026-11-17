import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import PermissionsService from "./PermissionService";

export const searchPermissions = createAsyncThunk(
  "permissions/search",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } =
        getState().permissions.query;
      const res = await PermissionsService.search({
        page,
        limit,
        searchText,
        sort,
        order,
      });
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Search failed" }
      );
    }
  }
);

export const permissionsSlice = createSlice({
  name: "permissions",
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
    updateVehicleTypesState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

export const { updateVehicleTypesState } = permissionsSlice.actions;

export default permissionsSlice.reducer;
export const permissionsSearchText = (state) =>
  state.permissions.query.searchText;
export const permissionsPage = (state) => state.permissions.query.page;
export const permissionsLimit = (state) => state.permissions.query.limit;
export const permissionsSort = (state) => state.permissions.query.sort;
export const permissionsQuery = (state) => state.permissions.query;
