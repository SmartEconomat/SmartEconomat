import { describe, expect, it } from 'vitest';

import {
  getPasswordValidationResult,
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../src/utils/passwordValidation';

describe('password validation', () => {
  it('accepts a strong password', () => {
    expect(isStrongPassword('ClaveSegura1!')).toBe(true);
  });

  it('rejects a weak password and exposes each failed rule', () => {
    expect(STRONG_PASSWORD_MESSAGE).toContain('8 caracteres');

    expect(getPasswordValidationResult('abc')).toEqual({
      hasMinLength: false,
      hasLowercase: true,
      hasUppercase: false,
      hasNumber: false,
      hasSymbol: false,
      isValid: false,
    });
  });
});
