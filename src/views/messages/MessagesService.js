import api from "../../api/api";

class MessagesService {
  searchChatPartners({
    page = 1,
    limit = 10,
    searchText = null,
    filter = null,
    sort = null,
    order = null,
    startDate = null,
    endDate = null,
    userid
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
    // Date range
    if (startDate) {
      params.push(`startDate=${encodeURIComponent(startDate)}`);
    }
    if (endDate) {
      params.push(`endDate=${encodeURIComponent(endDate)}`);
    }

    const url = `messages/chats/user/${userid}?${params.join("&")}`;

    return api.get(url).then((r) => {
      return {
        data: r.data?.data || [],
        pagination: r.data?.pagination || {},
        message: r.data?.message || null,
      };
    });
  }




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
