// BookingService.js
import api from "../../api/api";

class DisputeService {
  createDispute(data) {
    return api.post("/disputes", data).then((response) => {
      return response.data.data;
    });
  }
  reviewDispute(data, id) {
    return api.post(`/disputes/${id}/review`, data).then((response) => {
      return response.data.data;
    });
  }
  resolveDispute(data, id) {
    return api.post(`/disputes/${id}/resolve`, data).then((response) => {
      return response.data.data;
    });
  }
  rejectDispute(data, id) {
    return api.post(`/disputes/${id}/reject`, data).then((response) => {
      return response.data.data;
    });
  }

  searchDisputes({
    page = 1,
    limit = 10,
    searchText = null,
    filter = null,
    sort = null,
    order = null,
    startDate = null,
    endDate = null,
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
    // Date range
    if (startDate) {
      params.push(`startDate=${encodeURIComponent(startDate)}`);
    }
    if (endDate) {
      params.push(`endDate=${encodeURIComponent(endDate)}`);
    }

    const url = `disputes?${params.join("&")}`;

    return api.get(url).then((r) => {
      return {
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
        message: r.data?.message || null,
      };
    });
  }

  getDisputeById(id) {
    return api.get("/disputes/" + id).then((response) => {
      return response.data.data;
    });
  }

  getDisputeByUserId(userid) {
    return api.get("/disputes/user/" + userid).then((response) => {
      return response.data.data;
    });
  }
}

export default new DisputeService();
