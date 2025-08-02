/*
1) in sore.js file    
import brandReducer from '../views/brand/BrandRedux' // import the brand
    
    export const store = configureStore({
  reducer: {
     ......
    brand: brandReducer, // add the brand here
    
  },
})


2) in LayoutRouting.jsx

import BrandList from './views/brand/BrandList'
import BrandDetail from './views/brand/BrandDetails'

<Route path='brand' element={<BrandList/>}/>
<Route path='brand/:id' element={<BrandDetail/>}/>


3) in Sidebar.jsx (optional)

    await authService.checkPermmision(brand, 'read'))&&getItem(Brand,brand,<DashboardOutlined/>),
    
    and change the icon


4) back end index.js

const branRoute = require('./brand/branRouter');

{
    path: '/brand',
    route: branRoute,
  },

*/
    