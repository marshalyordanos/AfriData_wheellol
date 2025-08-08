
    import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
    import CarsService from './CarsService';


    export const searchCars = createAsyncThunk(
        "cars/searchCars",
        async (data, { rejectWithValue,getState }) => {
        try {
            
            const { searchText,page,limit,sort,order } = getState().cars.query; // Access state directly

            const res = await CarsService.searchCar({page,limit,searchText,sort,order});
            
    
            return res;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
        }
    );

    export const carsSlice = createSlice({
    name: 'cars',
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
        updateCarsState: (state,action) => {
        
        state.query = {...state.query,...action.payload}

        },
        
        
    },

    })

    export const { updateCarsState } = carsSlice.actions

    export default carsSlice.reducer
    export const carsSearchText = (state) => state.cars.query.searchText;
    export const carsPage = (state)=>state.cars.query.page
    export const carsLimit = (state)=>state.cars.query.limit
    export const carsSort = (state)=>state.cars.query.sort
    export const carsQuery = (state)=>state.cars.query


    
    