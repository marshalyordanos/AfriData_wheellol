import api from "../../api/api";

class CarsService {
  createCar(data) {
    return api
      .post("/car-owner/cars", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  updateCar(data, id) {
    return api
      .patch("/car-owner/cars/" + id, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  searchCar({ page, limit, searchText = null, sort = null, order }) {
    let url = `/admin/listcars?page=${page}&limit=${limit}`;
    if (sort) {
      const sortValue =
        order == "ascend" ? sort : order == "descend" ? "-" + sort : "";
      url = url + `&sort=${sortValue}`;
    }

    if (searchText) {
      url = url + `&searchText=${searchText}`;
    }

    return api.get(url).then((response) => {
      return { data: response.data.data, total: response.data.total };
    });
  }

  getCar(id) {
    return api.get("/cars/" + id).then((response) => {
      return response.data.data;
    });
  }

  deleteCar(id) {
    return api.delete("/cars/" + id).then((response) => {
      return response.data.data;
    });
  }

  carsDo({ method, payload }) {
    return api.post("/cars/do", { method, payload }).then((response) => {
      return response.data.data;
    });
  }

  carDo({ method, payload, id }) {
    return api.post("/cars/do/" + id, { method, payload }).then((response) => {
      return response.data.data;
    });
  }
}

export default new CarsService();
