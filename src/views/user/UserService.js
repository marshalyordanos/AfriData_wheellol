import api from '../../api/api';

class UserService {
    createUser(userData) {
        return api
            .post("/admin/users", userData)
            .then(response => {
                return response.data.data;
            });
    }

    updateUser(id, userData) {
        return api
            .patch("/admin/users/" + id, userData) 
            .then(response => {
                return response.data.data;
            });
    }

    searchUsers({ page, limit, searchText = null, sort = null, order = null }) {
        let url = `/admin/users?page=${page}&limit=${limit}`;

        if (sort) {
            const sortValue = order === 'ascend' ? sort : order === 'descend' ? '-' + sort : '';
            if (sortValue) {
                url += `&sort=${sortValue}`;
            }
        }

        if (searchText) {
            url += `&searchText=${searchText}`;
        }

        return api
            .get(url)
            .then(response => {
                return { data: response.data.data, total: response.data.total };
            });
    }

    getUser(id) {
        return api
            .get("/admin/users/" + id) 
            .then(response => {
                return response.data.data;
            });
    }

    deleteUser(id) {
        return api
            .delete("/admin/users/" + id)
            .then(response => {
                return response.data.data;
            });
    }

     userAction(action, userId) {
        return api
            .post(`/admin/users/${userId}/action`, { action: action })
            .then(response => {
                return response.data.data;
            });
    }
  
}

export default new UserService();