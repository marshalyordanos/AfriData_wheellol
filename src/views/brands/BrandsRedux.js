
    import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
    import BrandsService from './BrandsService';


    export const searchBrands = createAsyncThunk(
        "brands/searchBrands",
        async (data, { rejectWithValue,getState }) => {
        try {
            
            const { searchText,page,limit,sort,order } = getState().brands.query; // Access state directly

            const res = await BrandsService.searchBrand({page,limit,searchText,sort,order});
            
    
            return res;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
        }
    );

    export const brandsSlice = createSlice({
    name: 'brands',
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
        updateBrandsState: (state,action) => {
        
        state.query = {...state.query,...action.payload}

        },
        
        
    },

    })

    export const { updateBrandsState } = brandsSlice.actions

    export default brandsSlice.reducer
    export const brandsSearchText = (state) => state.brands.query.searchText;
    export const brandsPage = (state)=>state.brands.query.page
    export const brandsLimit = (state)=>state.brands.query.limit
    export const brandsSort = (state)=>state.brands.query.sort
    export const brandsQuery = (state)=>state.brands.query


    
    