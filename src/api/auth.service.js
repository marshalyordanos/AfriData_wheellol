import api from "./api";
import TokenService from "./token.service";

class AuthService {
  login(email, password) {
    return api
      .post("/user/login", {
        email,
        password
      })
      .then(response => {
        if (response.data.data.accessToken) {
          TokenService.setUser(response.data.data);
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

  async checkPermmision(permmission,value){
    const res  = await api
    .get(`/auth/checkPermmission/${permmission}/${value}`)
    
    return res.data?.data;
    
  }
}

export default new AuthService();
