// BookingService.js
import api from "../../api/api";

class ProfileService {
  getUserProfileById(id) {
    return api.get("/users/me/" + id).then((response) => {
      return response.data.data;
    });
  }

  updateProfile(id, data) {
    return api
      .patch("/users/me/" + id, data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        return response.data.data || response.data;
      });
  }
}

export default new ProfileService();
