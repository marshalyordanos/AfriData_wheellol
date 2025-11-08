import api from "../../api/api";

class NotificationService {
  getNotifications({ userid, page = 1, limit = 20 } = {}) {
    const url = `messages/notifications/${userid}?page=${page}&pageSize=${limit}`;
    return api.get(url).then((r) => {
      return {
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
      };
    });
  }

  unReadNotifications(userId) {
    return api
      .get(`/messages/notifications/unread-count/${userId}`)
      .then((r) => r.data?.data || r.data);
  }

  markAsRead(id, userId) {
    const url = `/messages/notifications/mark-as-read/${id}?userid=${userId}`;
    return api.post(url).then((r) => r.data?.data || r.data);
  }

  markAllRead(userId) {
    const url = `/messages/notifications/mark-as-read/${userId}`;
    return api.post(url).then((r) => r.data?.data || r.data);
  }
}

export default new NotificationService();
