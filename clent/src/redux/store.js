import { configureStore } from "@reduxjs/toolkit";
import realEstateReducer from "./slices/realEstateSlice";
import userReducer from "./slices/userSlice";
import escrowReducer from './slices/escrowSlice';


export const store = configureStore({
  reducer: {
    realEstate: realEstateReducer,
    escrow: escrowReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore paths that may contain BigInt
        ignoredPaths: ["realEstate.properties"],
      },
    }),
});

export default store;

// import { configureStore } from "@reduxjs/toolkit";
// import realEstateReducer from "./slices/realEstateSlice";
// import userReducer from "./slices/userSlice";
// import escrowReducer from './slices/escrowSlice';


// export const store = configureStore({
//   reducer: {
//     realEstate: realEstateReducer,
//     escrow: escrowReducer,
  
//     user: userReducer,
//   },
// });

// export default store;
