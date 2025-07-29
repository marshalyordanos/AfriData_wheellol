import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import usersReducer from "../views/users/UsersRedux";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
  },
});
