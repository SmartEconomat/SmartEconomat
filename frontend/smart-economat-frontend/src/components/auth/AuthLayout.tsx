import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const AuthLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-2/3 bg-gradient-to-br from-blue-800 to-blue-600 text-white items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">SmartEconomat</h1>
          <p className="mt-4 text-lg">Sistema Inteligente de Gestión</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        {children}
      </div>
    </div>
  );
};
