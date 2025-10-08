import api from "../../api/api";

class BrandsService {
  // CREATE
  createBrand(data) {
    return api.post("/car-makes", data).then((response) => response.data.data);
  }

  // UPDATE
  updateBrand(data, id) {
    return api
      .patch(`/car-makes/${id}`, data)
      .then((response) => response.data.data);
  }

  // LIST / SEARCH

  searchBrand({ page, limit, searchText = null, sort = null, order }) {
    let url = `/car-makes?page=${page}&limit=${limit}`;

    if (sort) {
      const sortValue =
        order === "ascend" ? sort : order === "descend" ? "-" + sort : "";
      url = url + `&sort=${sortValue}`;
    }

    if (searchText) {
      // 🔑 Use 'search' param if backend expects partial matching
      url = url + `&search=${encodeURIComponent(searchText)}`;
    }

    return api.get(url).then((response) => {
      const res = response.data;
      return {
        data: res.data || [],
        total: res.pagination?.total || (res.data ? res.data.length : 0),
      };
    });
  }

  // GET ONE
  getBrand(id) {
    return api.get(`/car-makes/${id}`).then((response) => response.data.data);
  }

  // DELETE
  deleteBrand(id) {
    return api
      .delete(`/car-makes/${id}`)
      .then((response) => response.data.data);
  }
}

export default new BrandsService();
