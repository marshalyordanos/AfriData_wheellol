import api from "../../api/api";

class GustService {
  createGust(data) {
    return api.post("/users/", data).then((response) => {
      return response.data.data;
    });
  }

  updateGust(data, id) {
    return api.patch("/users/" + id, data).then((response) => {
      return response.data.data;
    });
  }

  searchGusts({
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
            return `${key}:[${value.join(",")}]`;
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

    const url = `users/guests?${params.join("&")}`;

    return api.get(url).then((r) => ({
      data: r.data.data,
      total: r.data.pagination?.total,
    }));
  }

  getGust(id) {
    return api.get("/users/" + id).then((response) => {
      return response.data.data;
    });
  }

  activateGuest(id) {
    const data = {
      isActive: true,
    };
    return api
      .patch("/users/update-active-satus/" + id, data)
      .then((response) => {
        return response.data;
      });
  }
  deactivateGuest(id) {
    const data = {
      isActive: false,
    };
    return api
      .patch("/users/update-active-satus/" + id, data)
      .then((response) => {
        return response.data;
      });
  }
}

export default new GustService();
