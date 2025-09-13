// BookingService.js
import api from "../../api/api";

class BookingService {
  fetchBookings({
    page = 1,
    limit = 10,
    searchText = "",
    sort = "",
    order = "",
  } = {}) {
    let url = `/bookings?page=${page}&limit=${limit}`;

    if (sort) {
      const sortValue =
        order === "ascend" ? sort : order === "descend" ? `-${sort}` : "";
      url += `&sort=${sortValue}`;
    }

    if (searchText) {
      url += `&searchText=${encodeURIComponent(searchText)}`;
    }

    return api.get(url).then((res) => ({
      data: res.data.data,
      total: res.data.total || res.data.data.length,
    }));
  }

  // ✅ Add Create Booking
  createBooking(data) {
    return api.post(`/bookings`, data).then((res) => res.data);
  }

  cancelBooking(id) {
    return api.patch(`/bookings/${id}/cancel`).then((res) => res.data);
  }

  completeBooking(id) {
    return api.patch(`/bookings/${id}/complete`).then((res) => res.data);
  }

  deleteBooking(id) {
    return api.delete(`/bookings/${id}`).then((res) => res.data);
  }

  updateBooking(id, data) {
    return api.put(`/bookings/${id}`, data);
  }
}

export default new BookingService();
