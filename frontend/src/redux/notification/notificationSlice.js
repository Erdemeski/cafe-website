import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  soundEnabled: true,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setSoundEnabled(state, action) {
      state.soundEnabled = Boolean(action.payload);
    },
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
    },
  },
});

export const { setSoundEnabled, toggleSound } = notificationSlice.actions;
export default notificationSlice.reducer;


