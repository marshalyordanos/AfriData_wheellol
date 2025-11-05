/*
1) in sore.js file    
import cartypesReducer from '../views/cartypes/CartypesRedux' // import the cartypes
    
    export const store = configureStore({
  reducer: {
     ......
    cartypes: cartypesReducer, // add the cartypes here
    
  },
})


2) in LayoutRouting.jsx

import CartypesList from './views/cartypes/CartypesList'
import CartypesDetail from './views/cartypes/CartypesDetails'

<Route path='cartypes' element={<CartypesList/>}/>
<Route path='cartypes/:id' element={<CartypesDetail/>}/>


3) in Sidebar.jsx (optional)

    await authService.checkPermmision(cartypes, 'read'))&&getItem(Cartypes,cartypes,<DashboardOutlined/>),
    
    and change the icon


4) back end index.js

const cartypeRoute = require('./cartypes/cartypeRouter');

{
    path: '/cartypes',
    route: cartypeRoute,
  },

*/
    