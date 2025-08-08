/*
1) in sore.js file    
import carsReducer from '../views/cars/CarsRedux' // import the cars
    
    export const store = configureStore({
  reducer: {
     ......
    cars: carsReducer, // add the cars here
    
  },
})


2) in LayoutRouting.jsx

import CarsList from './views/cars/CarsList'
import CarsDetail from './views/cars/CarsDetails'

<Route path='cars' element={<CarsList/>}/>
<Route path='cars/:id' element={<CarsDetail/>}/>


3) in Sidebar.jsx (optional)

    await authService.checkPermmision(cars, 'read'))&&getItem(Cars,cars,<DashboardOutlined/>),
    
    and change the icon


4) back end index.js

const carRoute = require('./cars/carRouter');

{
    path: '/cars',
    route: carRoute,
  },

*/
    