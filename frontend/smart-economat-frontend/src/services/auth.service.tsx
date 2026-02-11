import { LoginRequest, LoginResponse } from "../types/auth.types";

const API_URL = import.meta.env.VITE_API_URL;

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al iniciar sesión");
  }

  return response.json();
};
