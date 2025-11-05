// BookingService.js
import api from "../../api/api";

class CancellationPoliciesService {
  createCancellationPolicy(data) {
    // data = {
    // "userType": "GUEST",
    // "daysBeforeTrip": 0,
    // "refundPercent": 0}

    return api.post("/cancellation-policies", data).then((response) => {
      return response.data; // return full payload ({ success, message, data })
    });
  }
  updateCancellationPolicy(data, id) {
    // data = {
    // "userType": "GUEST",
    // "daysBeforeTrip": 0,
    // "refundPercent": 0}

    return api.patch(`/cancellation-policies/${id}`, data).then((response) => {
      return response.data; // return full payload ({ success, message, data })
    });
  }
  deleteCancellationPolicy(id) {
    return api.delete(`/cancellation-policies/${id}`).then((response) => {
      return response.data; // return full payload ({ success, message, data })
    });
  }

  searchCancellationPolicies({
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

    const url = `/cancellation-policies?${params.join("&")}`;

    return api.get(url).then((r) => {
      return {
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
        message: r.data?.message || null,
      };
    });
  }

  getCancellationPolicyById(id) {
    return api.get("/cancellation-policies/" + id).then((response) => {
      return response.data.data;
    });
  }
}

export default new CancellationPoliciesService();
