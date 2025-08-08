/*
1) in sore.js file    
import brandsReducer from '../views/brands/BrandsRedux' // import the brands
    
    export const store = configureStore({
  reducer: {
     ......
    brands: brandsReducer, // add the brands here
    
  },
})


2) in LayoutRouting.jsx

import BrandsList from './views/brands/BrandsList'
import BrandsDetail from './views/brands/BrandsDetails'

<Route path='brands' element={<BrandsList/>}/>
<Route path='brands/:id' element={<BrandsDetail/>}/>


3) in Sidebar.jsx (optional)

    await authService.checkPermmision(brands, 'read'))&&getItem(Brands,brands,<DashboardOutlined/>),
    
    and change the icon


4) back end index.js

const brandRoute = require('./brands/brandRouter');

{
    path: '/brands',
    route: brandRoute,
  },

*/
    