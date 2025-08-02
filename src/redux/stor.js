import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import brandReducer from "../views/brand/BrandRedux"; // import the brand

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brand: brandReducer,
  },
});
