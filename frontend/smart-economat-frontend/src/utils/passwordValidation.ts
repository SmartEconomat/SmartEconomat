export const STRONG_PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.';

type PasswordValidationResult = {
  hasMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isValid: boolean;
};

export function getPasswordValidationResult(
  value: string
): PasswordValidationResult {
  const password = value ?? '';

  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z\d]/.test(password);

  return {
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSymbol,
    isValid:
      hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSymbol,
  };
}

export function isStrongPassword(value: string): boolean {
  return getPasswordValidationResult(value).isValid;
}
