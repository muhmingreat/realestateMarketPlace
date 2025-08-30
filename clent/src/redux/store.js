import { configureStore } from "@reduxjs/toolkit";
import realEstateReducer from "./slices/realEstateSlice";
import userReducer from "./slices/userSlice";
import escrowReducer from './slices/escrowSlice';
import web3authReducer from './slices/web3authSlice';

export const store = configureStore({
  reducer: {
    realEstate: realEstateReducer,
    escrow: escrowReducer,
    web3auth: web3authReducer,
    user: userReducer,
  },
});

export default store;
