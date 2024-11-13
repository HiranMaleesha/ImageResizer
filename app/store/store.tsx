// store/store.ts
'use client';
import { configureStore } from "@reduxjs/toolkit";
import imageUploadReducer from './imageUploadSlice';

export const store = configureStore({
    reducer: {
        imageUpload: imageUploadReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;