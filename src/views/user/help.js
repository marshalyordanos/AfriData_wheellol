/*
1) in sore.js file    
import userReducer from '../views/user/UserRedux' // import the user
    
    export const store = configureStore({
  reducer: {
     ......
    user: userReducer, // add the user here
    
  },
})


2) in LayoutRouting.jsx

import UserList from './views/user/UserList'
import UserDetail from './views/user/UserDetails'

<Route path='user' element={<UserList/>}/>
<Route path='user/:id' element={<UserDetail/>}/>


3) in Sidebar.jsx (optional)

    await authService.checkPermmision(user, 'read'))&&getItem(User,user,<DashboardOutlined/>),
    
    and change the icon


4) back end index.js

const useRoute = require('./user/useRouter');

{
    path: '/user',
    route: useRoute,
  },

*/
    