import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import brandsReducer from "../views/brands/BrandsRedux"; // import the brands
import modelsReducer from "../views/carModels/CarModelsRedux"; // import the brands
import userReducer from "../views/user/UserRedux"; // import the user
import categorysReducer from "../views/categorys/CategorysRedux"; // import the categorys
import carsReducer from "../views/cars/CarsRedux"; // import the cars
import bookingReducer from "../views/bookings/BookingRedux";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brands: brandsReducer, // add the brands here
    models: modelsReducer, // add the brands here
    user: userReducer, // add the user here
    categorys: categorysReducer, // add the categorys here
    cars: carsReducer, // add the cars here
    booking: bookingReducer,
  },
});
