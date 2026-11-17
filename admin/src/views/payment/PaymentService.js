// BookingService.js
import api from "../../api/api";

class PaymentService {
  releasePayment(data) {
    // data = {
    //   bookingId: "cmgy6qf6q0001lisxnt26cly6",
    //   hostId: "cmg2t1x0w0004liat1dpp598x",
    // };

    return api.post("/payments/release", data).then((response) => {
      return response.data.data;
    });
  }
  refundPayment(data) {
    // data = {
    //   bookingId: "cmgy6qf6q0001lisxnt26cly6",
    //   refundAmount: 100,
    //   reason: "test",
    // };

    return api.post("/payments/refund", data).then((response) => {
      return response.data.data;
    });
  }

  searchPayments({
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

    const url = `payments?${params.join("&")}`;

    return api.get(url).then((r) => {
      // backend returns { success, message, data: [...], pagination }
      return {
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
        message: r.data?.message || null,
      };
    });
  }

  getPaymentById(id) {
    return api.get("/payments/" + id).then((response) => {
      return response.data.data;
    });
  }
}

export default new PaymentService();
