import { useState, FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { validatePassword, validateEmailOrUsername } from "../utils/validator";

export const LoginForm = () => {
  const { login, isLoading, authError } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<{
    emailOrUsername?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailError = validateEmailOrUsername(emailOrUsername);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        emailOrUsername: emailError || undefined,
        password: passwordError || undefined,
      });
      return;
    }

    setErrors({});
    await login({emailOrUsername, password });
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>

      {authError && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Usuario o Email</label>
          <input
            type="text"
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
          />
          {errors.emailOrUsername && (
            <p className="text-red-500 text-sm mt-1">
              {errors.emailOrUsername}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Contraseña</label>
          <input
            type="password"
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isLoading ? "Cargando..." : "Acceder"}
        </button>
      </form>
    </div>
  );
};
