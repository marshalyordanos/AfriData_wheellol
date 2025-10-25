import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import brandsReducer from "../views/brands/BrandsRedux"; // import the brands
import modelsReducer from "../views/carModels/CarModelsRedux"; // import the brands
import userReducer from "../views/user/UserRedux"; // import the user
import vehicleTypesReducer from "../views/vehicleTypes/VehicleTypesRedux"; // vehicle types slice
import carsReducer from "../views/cars/CarsRedux"; // import the cars
import bookingReducer from "../views/bookings/BookingRedux";
import permissionsReducer from "../views/permissions/PermissionRedux";
import rolesReducer from "../views/roles/RoleRedux";
import hostReducer from "../views/host/HostRedux";
import staffReducer from "../views/staff/StaffRedux";
import gustReducer from "../views/gust/GustRedux";
import profileReducer from "../views/profile/ProfileRedux";
import messagesReducer from "../views/messages/MessageRedux";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brands: brandsReducer, // add the brands here
    models: modelsReducer, // add the brands here
    user: userReducer, // add the user here
    vehicleTypes: vehicleTypesReducer, // add the vehicle types here
    cars: carsReducer, // add the cars here
    booking: bookingReducer,
    profile: profileReducer,
    messages: messagesReducer,
    permissions: permissionsReducer,
    roles: rolesReducer,
    host: hostReducer,
    staff: staffReducer,
    gust: gustReducer,
  },
});
