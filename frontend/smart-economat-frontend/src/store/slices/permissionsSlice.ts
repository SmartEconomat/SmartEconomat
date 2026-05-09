import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PermissionsState {
  permissions: Record<string, boolean>;
}

const initialState: PermissionsState = {
  permissions: {},
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions(
      state,
      action: PayloadAction<string[] | Record<string, boolean>>
    ) {
      if (Array.isArray(action.payload)) {
        state.permissions = action.payload.reduce(
          (acc, perm) => {
            acc[perm] = true;
            return acc;
          },
          {} as Record<string, boolean>
        );
      } else {
        state.permissions = { ...action.payload };
      }
    },
    resetPermissions(state) {
      state.permissions = {};
    },
    addPermission(state, action: PayloadAction<string>) {
      state.permissions[action.payload] = true;
    },
    removePermission(state, action: PayloadAction<string>) {
      delete state.permissions[action.payload];
    },
  },
});

/**
 * Constantes públicas ({
 *   setPermissions,
 *   resetPermissions,
 *   addPermission,
 *   removePermission,
 * }) expuestas en smart-economat-frontend (SPA).
 */
export const {
  setPermissions,
  resetPermissions,
  addPermission,
  removePermission,
} = permissionsSlice.actions;

export default permissionsSlice.reducer;
