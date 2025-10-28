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
    searchText = null,
    filter = null,
    sort = null,
    order = null,
  } = {}) {
    let params = [];

    // Pagination
    params.push(`page=${page}`);
    params.push(`pageSize=${limit}`);

    //search
    if (searchText) {
      params.push(`search=all:${encodeURIComponent(searchText)}`);
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
    return api.patch("/bookings/" + id + "/cancel-host").then((response) => {
      return response.data;
    });
  }
  confirmBooking(id) {
    return api.patch("/bookings/" + id + "/confirm-host").then((response) => {
      return response.data;
    });
  }
  rejectBooking(id) {
    return api.patch("/bookings/" + id + "/reject-host").then((response) => {
      return response.data;
    });
  }
  completeBooking(id) {
    return api.patch("/bookings/" + id + "/complete-host").then((response) => {
      return response.data;
    });
  }
  deleteBooking(id) {
    return api.delete("/bookings/" + id).then((response) => {
      return response.data;
    });
  }

  pickupInspection(data) {
    return api.post("/bookings/inspection", data).then((response) => {
      return response.data;
    });
  }
  updatePickupInspection(id, data) {
    return api.patch("/bookings/inspection/" + id, data).then((response) => {
      return response.data;
    });
  }

  dropoffInspection(data) {
    return api.post("/bookings/inspection", data).then((response) => {
      return response.data;
    });
  }

  updatedDopoffInspection(id, data) {
    return api.patch("/bookings/inspection/" + id, data).then((response) => {
      return response.data;
    });
  }

  approveDopoffInspection(id) {
    return api.patch("/bookings/inspection/approve/" + id).then((response) => {
      return response.data;
    });
  }
  createDispute(data) {
    return api.post("/disputes", data).then((response) => {
      return response.data;
    });
  }

  /////////////////////////////////////////////////////
  //messages services
  sendMessage(data) {
    return api.post("/messages", data).then((response) => {
      return response.data;
    });
  }
  markAsRead(data) {
    return api.post("/messages/mark-as-read", data).then((response) => {
      return response.data;
    });
  }
  getAllMessagesOfABooking(id) {
    return api.get("/messages/booking/" + id).then((response) => {
      return response.data;
    });
  }
  getAllMessageChatsOfAUser(id) {
    return api.get("/messages/chats/user/" + id).then((response) => {
      return response.data;
    });
  }
  getAllUnreadMessagesOfAUser(userid) {
    return api.get("/messages/unread-count/" + userid).then((response) => {
      return response.data;
    });
  }
  // ///////////////////////////////////////////

  //diputes

  getDisputeById(id) {
    return api.get("/disputes/" + id).then((response) => {
      return response.data;
    });
  }

  createDispute(data) {
    return api.post("/disputes/", data).then((response) => {
      return response.data;
    });
  }
}

export default new BookingService();
