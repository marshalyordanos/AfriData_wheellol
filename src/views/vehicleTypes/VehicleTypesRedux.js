import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import VehicleTypesService from "./VehicleTypesService";

export const searchVehicleTypes = createAsyncThunk(
  "vehicleTypes/search",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { searchText, page, limit, sort, order } =
        getState().vehicleTypes.query;
      const res = await VehicleTypesService.search({
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

export const vehicleTypesSlice = createSlice({
  name: "vehicleTypes",
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
    updateVehicleTypesState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
});

export const { updateVehicleTypesState } = vehicleTypesSlice.actions;

export default vehicleTypesSlice.reducer;
export const vehicleTypesSearchText = (state) =>
  state.vehicleTypes.query.searchText;
export const vehicleTypesPage = (state) => state.vehicleTypes.query.page;
export const vehicleTypesLimit = (state) => state.vehicleTypes.query.limit;
export const vehicleTypesSort = (state) => state.vehicleTypes.query.sort;
export const vehicleTypesQuery = (state) => state.vehicleTypes.query;
