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

type PasswordChangeValidationOptions = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword?: string;
  requireCurrentPassword?: boolean;
};

export function getPasswordChangeError({
  currentPassword,
  newPassword,
  confirmPassword,
  requireCurrentPassword = false,
}: PasswordChangeValidationOptions): string | null {
  const normalizedCurrentPassword = currentPassword ?? '';
  const normalizedNewPassword = newPassword ?? '';
  const normalizedConfirmPassword = confirmPassword ?? '';

  if (requireCurrentPassword && normalizedCurrentPassword.length === 0) {
    return 'La contraseña actual es obligatoria.';
  }

  if (normalizedNewPassword.length === 0) {
    return 'La nueva contraseña es obligatoria.';
  }

  if (confirmPassword !== undefined && normalizedConfirmPassword.length === 0) {
    return 'Debes confirmar la nueva contraseña.';
  }

  if (
    normalizedCurrentPassword.length > 0 &&
    normalizedCurrentPassword === normalizedNewPassword
  ) {
    return 'La nueva contraseña debe ser diferente de la actual.';
  }

  if (
    confirmPassword !== undefined &&
    normalizedNewPassword !== normalizedConfirmPassword
  ) {
    return 'Las contraseñas no coinciden.';
  }

  if (!isStrongPassword(normalizedNewPassword)) {
    return STRONG_PASSWORD_MESSAGE;
  }

  return null;
}
