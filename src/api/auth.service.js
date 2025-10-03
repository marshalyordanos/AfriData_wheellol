import api from "./api";
import TokenService from "./token.service";

class AuthService {
  login(phone, password) {
    return api
      .post("/auth/login", {
        phone,
        password,
      })
      .then((response) => {
        // Adapt to new backend response structure
        if (response.data && response.data.success && response.data.data) {
          const { user, tokens } = response.data.data;
          return {
            success: response.data.success,
            message: response.data.message,
            user,
            tokens,
          };
        }
        return response.data.data;
      });
  }

  logout() {
    TokenService.removeUser();
  }

  forgotPassword(email) {
    return api.post("/user/forgot-password", { email });
  }

  resetPassword(newPassword, tokenFromEmail) {
    return api.post(`/user/reset-password/${tokenFromEmail}`, { newPassword });
  }

  register(formData) {
    return api.post("/user/register", formData);
  }

  getCurrentUser() {
    return TokenService.getUser();
  }

  async checkPermmision(permmission, value) {
    const res = await api.get(`/auth/checkPermmission/${permmission}/${value}`);

    return res.data?.data;
  }
}

export default new AuthService();
