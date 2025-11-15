import api from "../../api/api";

class PayoutService {
 
  releasePayment(payoutId,data) {
    // data={ status: 'APPROVED' | 'REJECTED'; reason?: string }
    return api.patch(`/users/host/${payoutId}/status`, data).then((response) => {
      return response.data.data;
    });
  }
  withdraw(data) {
   
    return api.post("/users/host/withdraw", data).then((response) => {
      return response.data.data;
    });
  }

  searchPayouts({
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

    const url = `/users/host/payout?${params.join("&")}`;

    return api.get(url).then((r) => {
      // backend returns { success, message, data: [...], pagination }
      return {
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
        message: r.data?.message || null,
      };
    });
  }

}

export default new PayoutService();
