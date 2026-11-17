import api from "./api";
import TokenService from "./token.service";

class AuthService {
  login(phone, password) {
    return api
      .post("/auth/login-admin", {
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

  resetPassword(data) {
    // data = {
    //   phoneNumber: "1231231234",
    //   newPassword: "12345678",
    //   otp: "516974",
    // };
    return api.post(`/auth/reset-password`, data);
  }
  verifyPhoneNumber(data) {
    // data = {
    //   phone: "1231231234",
    //   otp: "516974",
    // };
    return api.post(`/auth/verify-phone`, data);
  }
  requestPasswordReset(data) {
    // data = {
    //   phoneNumber: "1231231234",
    // };
    return api.post(`/auth/request-password-reset`, data);
  }

  register(formData) {
    return api.post("/auth/register", formData);
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
