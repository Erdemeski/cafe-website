import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentUser: null,
    error: null,
    loading: false,
    sessionExpiresAt: null,
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        signInStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        signInSuccess: (state, action) => {
            state.currentUser = action.payload;
            state.sessionExpiresAt = action.payload?.sessionExpiresAt || null;
            state.loading = false;
            state.error = null;
        },
        signInFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        // Update only the session expiry timestamp without touching currentUser
        sessionRefreshSuccess: (state, action) => {
            state.sessionExpiresAt = action.payload || null;
        },
        updateStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        updateSuccess: (state, action) => {
            state.currentUser = action.payload;
            state.loading = false;
            state.error = null;
        },
        updateFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        deleteUserStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        deleteUserSuccess: (state) => {
            state.currentUser = null;
            state.loading = false;
            state.error = null;
        },
        deleteUserFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        signoutSuccess: (state) => {
            state.currentUser = null;
            state.sessionExpiresAt = null;
            state.loading = false;
            state.error = null;
        },
        sessionExpired: (state) => {
            state.currentUser = null;
            state.sessionExpiresAt = null;
            state.loading = false;
            state.error = null;
        }
    },
});

export const { signInStart, signInSuccess, signInFailure, sessionRefreshSuccess, updateStart, updateSuccess, updateFailure, deleteUserStart, deleteUserSuccess, deleteUserFailure, signoutSuccess, sessionExpired } = userSlice.actions;
export default userSlice.reducer;