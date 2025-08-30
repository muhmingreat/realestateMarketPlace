import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  properties: [],
  myProperties: [],
  highestRated: null,
  reviews: {},
  userReviews: [],
  loading: false,
  error: null,
   searchQuery: ""
};

const realEstateSlice = createSlice({
  name: "realEstate",
  initialState,
  reducers: {
    // Property related
    setProperties: (state, action) => {
      state.properties = action.payload;
    },
    setMyProperties: (state, action) => {
      state.myProperties = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    addProperty: (state, action) => {
      state.properties.push(action.payload);
    },
    updateProperty: (state, action) => {
      const index = state.properties.findIndex(
        (p) => p.productID === action.payload.productID
      );
      if (index !== -1) {
        state.properties[index] = {
          ...state.properties[index],
          ...action.payload,
        };
      }
    },
    updatePrice: (state, action) => {
      const { productID, price } = action.payload;
      const index = state.properties.findIndex((p) => p.productID === productID);
      if (index !== -1) {
        state.properties[index].price = price;
      }
    },
    setHighestRated: (state, action) => {
      state.highestRated = action.payload;
    },

    // Reviews
    setReviews: (state, action) => {
      const { productID, reviews } = action.payload;
      state.reviews[productID] = reviews;
    },
    addReview: (state, action) => {
      const { productID, review } = action.payload;
      if (!state.reviews[productID]) {
        state.reviews[productID] = [];
      }
      state.reviews[productID].push(review);
    },
    likeReview: (state, action) => {
      const { productID, reviewIndex } = action.payload;
      if (state.reviews[productID] && state.reviews[productID][reviewIndex]) {
        state.reviews[productID][reviewIndex].likes += 1;
      }
    },
    setUserReviews: (state, action) => {
      state.userReviews = action.payload;
    },

    // Loading & Error
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setProperties,
  setMyProperties,
  addProperty,
  updateProperty,
  updatePrice,
  setHighestRated,
  setReviews,
  addReview,
  likeReview,
  setUserReviews,
  setLoading,
  setError,
  setSearchQuery,
} = realEstateSlice.actions;

export default realEstateSlice.reducer;
