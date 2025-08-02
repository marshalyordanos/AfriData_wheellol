
    import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
    import BrandService from './BrandService';


    export const searchBrand = createAsyncThunk(
        "brand/searchBrand",
        async (data, { rejectWithValue,getState }) => {
        try {
            
            const { searchText,page,limit,sort,order } = getState().brand.query; // Access state directly

            const res = await BrandService.searchBran({page,limit,searchText,sort,order});
            
    
            return res;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
        }
    );

    export const brandSlice = createSlice({
    name: 'brand',
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
        updateBrandState: (state,action) => {
        
        state.query = {...state.query,...action.payload}

        },
        
        
    },

    })

    export const { updateBrandState } = brandSlice.actions

    export default brandSlice.reducer
    export const brandSearchText = (state) => state.brand.query.searchText;
    export const brandPage = (state)=>state.brand.query.page
    export const brandLimit = (state)=>state.brand.query.limit
    export const brandSort = (state)=>state.brand.query.sort
    export const brandQuery = (state)=>state.brand.query


    
    