import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CategoriaProducto } from '../services/producto.types';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    productCategory?: CategoriaProducto;
}

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    productCategory?: CategoriaProducto;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type: ToastType, duration?: number, options?: ToastOptions) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType, duration = 3000, options?: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, message, type, duration, productCategory: options?.productCategory };

        setToasts((prevToasts) => [...prevToasts, newToast]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe ser usado dentro de un ToastProvider');
    }

    const { addToast } = context;

    return React.useMemo(() => ({
        success: (msg: string, dur?: number, options?: ToastOptions) => addToast(msg, 'success', dur, options),
        error: (msg: string, dur?: number, options?: ToastOptions) => addToast(msg, 'error', dur, options),
        info: (msg: string, dur?: number, options?: ToastOptions) => addToast(msg, 'info', dur, options),
        warning: (msg: string, dur?: number, options?: ToastOptions) => addToast(msg, 'warning', dur, options),
    }), [addToast]);
};

export const useToastList = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastList debe ser usado dentro de un ToastProvider');
    }
    return { toasts: context.toasts, removeToast: context.removeToast };
};
