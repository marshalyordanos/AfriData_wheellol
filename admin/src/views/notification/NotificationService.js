import api from "../../api/api";

// In-app notifications of the signed-in admin (token based, see backend /notifications).
class NotificationService {
  list({ page = 1, pageSize = 20, unread = false } = {}) {
    return api
      .get("/notifications", { params: { page, pageSize, unread: unread || undefined } })
      .then((r) => ({
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
        unreadCount: r.data?.unreadCount ?? 0,
      }));
  }

  unreadCount() {
    return api.get("/notifications/unread-count").then((r) => r.data?.data?.count ?? 0);
  }

  markRead(id) {
    return api.patch(`/notifications/${id}/read`).then((r) => r.data?.data);
  }

  markAllRead() {
    return api.patch("/notifications/read-all").then((r) => r.data?.data);
  }

  // ---- Old userId-based endpoints (booking flow), kept for reference ----
  getNotifications({ userid, page = 1, limit = 20 } = {}) {
    const url = `messages/notifications/${userid}?page=${page}&pageSize=${limit}`;
    return api.get(url).then((r) => ({
      data: r.data?.data || [],
      pagination: r.data?.pagination || {},
    }));
  }

  unReadNotifications(userId) {
    return api
      .get(`/messages/notifications/unread-count/${userId}`)
      .then((r) => r.data?.data || r.data);
  }
}

export default new NotificationService();
