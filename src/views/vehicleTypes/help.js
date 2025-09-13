/*
1) in sore.js file    
import categorysReducer from '../views/categorys/CategorysRedux' // import the categorys
    
    export const store = configureStore({
  reducer: {
     ......
    categorys: categorysReducer, // add the categorys here
    
  },
})


2) in LayoutRouting.jsx

import CategorysList from './views/categorys/CategorysList'
import CategorysDetail from './views/categorys/CategorysDetails'

<Route path='categorys' element={<CategorysList/>}/>
<Route path='categorys/:id' element={<CategorysDetail/>}/>


3) in Sidebar.jsx (optional)

    await authService.checkPermmision(categorys, 'read'))&&getItem(Categorys,categorys,<DashboardOutlined/>),
    
    and change the icon


4) back end index.js

const categoryRoute = require('./categorys/categoryRouter');

{
    path: '/categorys',
    route: categoryRoute,
  },

*/
    