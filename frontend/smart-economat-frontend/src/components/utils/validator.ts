export const validatePassword = (password: string): string | null => {
  const minLength = /.{8,}/;
  const uppercase = /[A-Z]/;
  const number = /[0-9]/;
  const symbol = /[^A-Za-z0-9]/;

  if (!minLength.test(password)) {
    return "La contraseña debe tener al menos 8 caracteres";
  }

  if (!uppercase.test(password)) {
    return "La contraseña debe contener al menos una mayúscula";
  }

  if (!number.test(password)) {
    return "La contraseña debe contener al menos un número";
  }

  if (!symbol.test(password)) {
    return "La contraseña debe contener al menos un símbolo";
  }

  return null;
};

export const validateEmailOrUsername = (value: string): string | null => {
  if (value.includes("@")) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "El email no tiene un formato válido";
    }
  } else {
    if (value.length < 3) {
      return "El nombre de usuario debe tener al menos 3 caracteres";
    }
  }

  return null;
};
