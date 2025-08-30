// src/redux/web3authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  web3auth: null,   // Web3Auth instance
  provider: null,   // provider returned after login
  user: null,       // user info (email, name, etc)
  address: null,    // wallet address
  loading: false,
  error: null,
};

const web3authSlice = createSlice({
  name: "web3auth",
  initialState,
  reducers: {
    setWeb3auth: (state, action) => {
      state.web3auth = action.payload;
    },
    setProvider: (state, action) => {
      state.provider = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAddress: (state, action) => {
      state.address = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.provider = null;
      state.user = null;
      state.address = null;
    },
  },
});

export const {
  setWeb3auth,
  setProvider,
  setUser,
  setAddress,
  setLoading,
  setError,
  logout,
} = web3authSlice.actions;

export default web3authSlice.reducer;
