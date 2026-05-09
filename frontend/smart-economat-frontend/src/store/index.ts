import { configureStore } from '@reduxjs/toolkit';
import permissionsReducer from './slices/permissionsSlice';

/** Constantes públicas (store) expuestas en smart-economat-frontend (SPA). */
export const store = configureStore({
  reducer: {
    permissions: permissionsReducer,
  },
});

/** Alias público (RootState) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type RootState = ReturnType<typeof store.getState>;
/** Alias público (AppDispatch) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type AppDispatch = typeof store.dispatch;
