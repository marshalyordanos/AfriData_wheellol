import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import bookingService from "./BookingService";

// --- Thunks ---
export const fetchBookingsThunk = createAsyncThunk(
  "bookings/fetchBookings",
  async (params, { rejectWithValue }) => {
    try {
      const data = await bookingService.searchBookings(params);
      return data; 
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createBookingThunk = createAsyncThunk(
  "bookings/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(data);
      return response; // created booking object
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateBookingThunk = createAsyncThunk(
  "bookings/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBooking(data, id);
      return response; // updated booking object
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const cancelBookingThunk = createAsyncThunk(
  "bookings/cancelBooking",
  async (id, { rejectWithValue }) => {
    try {
      const data = await bookingService.cancelBooking(id);
      return data; 
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const completeBookingThunk = createAsyncThunk(
  "bookings/completeBooking",
  async (id, { rejectWithValue }) => {
    try {
      const data = await bookingService.completeBooking(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteBookingThunk = createAsyncThunk(
  "bookings/deleteBooking",
  async (id, { rejectWithValue }) => {
    try {
      const data = await bookingService.deleteBooking(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// --- Slice ---
const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    bookings: [],
    query: { page: 1, limit: 10, searchText: "", sort: "", order: "" },
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    updateBookingState: (state, action) => {
      state.query = { ...state.query, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bookings
      .addCase(fetchBookingsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchBookingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create booking 
      .addCase(createBookingThunk.fulfilled, (state, action) => {
        state.bookings = [action.payload.data, ...state.bookings];
        state.total += 1;
      })

      // Update booking
      .addCase(updateBookingThunk.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.bookings = state.bookings.map((b) =>
          b._id === updated._id ? updated : b
        );
      })

      // Cancel booking
      .addCase(cancelBookingThunk.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.bookings = state.bookings.map((b) =>
          b._id === updated._id ? updated : b
        );
      })

      // Complete booking
      .addCase(completeBookingThunk.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.bookings = state.bookings.map((b) =>
          b._id === updated._id ? updated : b
        );
      })

      // Delete booking
      .addCase(deleteBookingThunk.fulfilled, (state, action) => {
        const deletedId = action.meta.arg;
        state.bookings = state.bookings.filter((b) => b._id !== deletedId);
        state.total -= 1;
      });
  },
});

export const { updateBookingState } = bookingSlice.actions;
export const bookingQuery = (state) => state.booking.query;
export const bookingSearchText = (state) => state.booking.query.searchText;
export default bookingSlice.reducer;
