import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tableNumber: null,
  expiresAt: null, // timestamp (ms)
};

const tableCookieSlice = createSlice({
  name: "tableCookie",
  initialState,
  reducers: {
    setTableCookie: (state, action) => {
      state.tableNumber = action.payload.tableNumber;
      state.expiresAt = action.payload.expiresAt;
    },
    clearTableCookie: (state) => {
      state.tableNumber = null;
      state.expiresAt = null;
    },
  },
});

export const { setTableCookie, clearTableCookie } = tableCookieSlice.actions;
export default tableCookieSlice.reducer; 