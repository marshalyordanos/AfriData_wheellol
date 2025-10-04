import api from "../../api/api";

class RolesService {
  // Create
  create(data) {
    return api
      .post("access-control/roles", data)
      .then((r) => r.data.data);
  }

  // Update
  update(id, data) {
    return api
      .patch(`access-control/roles/${id}`, data)
      .then((r) => r.data.data);
  }

  // List / Search
  search({
    page = 1,
    limit = 10,
    search = null, 
    filter = null, 
    sort = null,
  } = {}) {
    let params = [];

    // Pagination
    params.push(`page=${page}`);
    params.push(`pageSize=${limit}`);

    // Search
    if (search) {
      const searchParams = Object.entries(search)
        .map(([key, value]) => `${key}:${value}`)
        .join(",");
      params.push(`search=${encodeURIComponent(searchParams)}`);
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
      const sortParams = Object.entries(sort)
        .map(([key, value]) => `${key}:${value}`)
        .join(",");
      params.push(`sort=${encodeURIComponent(sortParams)}`);
    }

    const url = `access-control/roles?${params.join("&")}`;

    return api.get(url).then((r) => ({
      data: r.data.data,
      total: r.data.total,
    }));
  }

  // Single fetch
  get(id) {
    return api.get(`access-control/roles/${id}`).then((r) => r.data.data);
  }

  // Delete
  remove(id) {
    return api
      .delete(`access-control/roles/${id}`)
      .then((r) => r.data.data);
  }
}

export default new RolesService();
