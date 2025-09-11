import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  vetting_id: null,  // Add vetting_id to the initial state
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    removeUser: (state) => {
      state.user = null;
    },
    setVettingId: (state, action) => { // Add the setVettingId reducer
      state.vetting_id = action.payload; // Update the vetting_id in state
    },
  },
});

export const { setUser, removeUser, setVettingId } = userSlice.actions; // Export setVettingId

export default userSlice.reducer;
