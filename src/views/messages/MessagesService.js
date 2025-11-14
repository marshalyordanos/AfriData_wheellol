import api from "../../api/api";

class MessagesService {
  sendMessage(data) {
    return api.post("/messages", data).then((response) => {
      return response.data;
    });
  }
  markAsRead(data) {
    return api.post("/messages/mark-as-read", data).then((response) => {
      return response.data;
    });
  }
  getAllMessagesOfABooking(id, page = 1, pageSize = 10) {
    const qs = `?page=${page}&pageSize=${pageSize}`;
    return api.get(`/messages/booking/${id}${qs}`).then((response) => {
      return response.data;
    });
  }
  getAllMessageChatsOfAUser(id, page = 1, pageSize = 20) {
    const qs = `?page=${page}&pageSize=${pageSize}`;
    return api.get(`/messages/chats/user/${id}${qs}`).then((response) => {
      return response.data;
    });
  }
  getAllUnreadMessagesOfAUser(userid) {
    return api.get("/messages/unread-count/" + userid).then((response) => {
      return response.data;
    });
  }
}

export default new MessagesService();
