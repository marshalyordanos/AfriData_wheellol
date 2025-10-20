// BookingService.js
import api from "../../api/api";

class BookingService {
  createBooking(data) {
    return api.post("/bookings", data).then((response) => {
      return response.data.data;
    });
  }

  updateBooking(data, id) {
    return api.patch("/bookings/" + id, data).then((response) => {
      return response.data.data;
    });
  }

  searchBookings({
    page = 1,
    limit = 10,
    search = null,
    filter = null,
    sort = null,
    order = null,
  } = {}) {
    let params = [];

    // Pagination
    params.push(`page=${page}`);
    params.push(`pageSize=${limit}`);

    // Search
    if (search) {
      params.push(`search=all:${encodeURIComponent(search)}`);
    }

    // Filter
    if (filter) {
      const filterParams = Object.entries(filter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}:[${value.join(",")} ]`;
          }
          return `${key}:${value}`;
        })
        .join(",");
      params.push(`filter=${encodeURIComponent(filterParams)}`);
    }

    // Sort
    if (sort) {
      let sortValue = `${sort}:${order || "asc"}`;
      params.push(`sort=${sortValue}`);
    }

    const url = `bookings?${params.join("&")}`;

    return api.get(url).then((r) => ({
      data: r.data.data,
      total: r.data.pagination?.total,
    }));
  }

  getBookingById(id) {
    return api.get("/bookings/" + id).then((response) => {
      return response.data.data;
    });
  }

  cancelBooking(id) {
    return api.patch("/booking/cancel" + id, data).then((response) => {
      return response.data;
    });
  }
}

export default new BookingService();
