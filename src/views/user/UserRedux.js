import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import UserService from './UserService'; 

export const fetchUsers = createAsyncThunk(
    "user/fetchUsers",
    async (_, { rejectWithValue, getState }) => {
        try {
            const query = getState().user.query;
            const response = await UserService.searchUsers(query);
            return response; // returns { data: [users], total: number }
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to fetch users');
        }
    }
);

export const deleteUser = createAsyncThunk(
    "user/deleteUser",
    async (userId, { rejectWithValue }) => {
        try {
            await UserService.deleteUser(userId);
            return userId;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to delete user');
        }
    }
);

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        users: [],  
        status: 'idle',
        error: null,
        query: {
            searchText: '',
            page: 1,
            limit: 10,
            sort: '',
            order: ''
        }
    },
    reducers: {
        updateUserQuery: (state, action) => {
            state.query = { ...state.query, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            // Cases for fetching users
            .addCase(fetchUsers.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.users = action.payload.data;
                state.total = action.payload.total;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Case for deleting a user
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(user => user._id !== action.payload);
            });
    },
});

export const { updateUserQuery } = userSlice.actions;
export default userSlice.reducer;

export const selectAllUsers = (state) => state.user.users;
export const selectUserTotal = (state) => state.user.total;
export const selectUserStatus = (state) => state.user.status;
export const selectUserQuery = (state) => state.user.query;