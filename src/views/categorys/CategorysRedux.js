
    import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
    import CategorysService from './CategorysService';


    export const searchCategorys = createAsyncThunk(
        "categorys/searchCategorys",
        async (data, { rejectWithValue,getState }) => {
        try {
            
            const { searchText,page,limit,sort,order } = getState().categorys.query; // Access state directly

            const res = await CategorysService.searchCategory({page,limit,searchText,sort,order});
            
    
            return res;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
        }
    );

    export const categorysSlice = createSlice({
    name: 'categorys',
    initialState:{
        query:{
            searchText:'',
            page:1,
            limit:5,
            sort:'',
            order:''
        }
    },
    reducers: {
        updateCategorysState: (state,action) => {
        
        state.query = {...state.query,...action.payload}

        },
        
        
    },

    })

    export const { updateCategorysState } = categorysSlice.actions

    export default categorysSlice.reducer
    export const categorysSearchText = (state) => state.categorys.query.searchText;
    export const categorysPage = (state)=>state.categorys.query.page
    export const categorysLimit = (state)=>state.categorys.query.limit
    export const categorysSort = (state)=>state.categorys.query.sort
    export const categorysQuery = (state)=>state.categorys.query


    
    