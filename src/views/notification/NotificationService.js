import api from "../../api/api";

class NotificationService {
  getNotifications({ page = 1, limit = 20 } = {}) {
    const url = `notifications?page=${page}&pageSize=${limit}`;
    return api.get(url).then((r) => {
      return {
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
      };
    });
  }

  markAsRead(id) {
    return api
      .post(`/notifications/${id}/read`)
      .then((r) => r.data?.data || r.data);
  }

  markAllRead() {
    return api
      .post(`/notifications/read-all`)
      .then((r) => r.data?.data || r.data);
  }
}

export default new NotificationService();
