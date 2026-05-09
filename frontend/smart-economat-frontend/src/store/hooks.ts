import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Expone "useAppDispatch" en smart-economat-frontend (SPA).
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/redux-thunk/dist/redux-thunk").ThunkDispatch<{ permissions: PermissionsState; }, undefined, import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/redux/dist/redux").UnknownAction> & import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/redux/dist/redux").Dispatch<import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/redux/dist/redux").UnknownAction>} Datos efectivos después de ejecutar la operación.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
/** Constantes públicas (useAppSelector) expuestas en smart-economat-frontend (SPA). */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
