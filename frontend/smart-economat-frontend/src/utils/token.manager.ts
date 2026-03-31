/**
 * TokenManager is a simple utility to manage the JWT in memory.
 * This ensures that the token is never stored in persistent storage (localStorage/sessionStorage).
 */
class TokenManager {
  private token: string | null = null;

  /**
   * Sets the token in memory.
   * @param token The JWT string.
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Gets the token from memory.
   * @returns The JWT string or null.
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clears the token from memory.
   */
  clearToken() {
    this.token = null;
  }
}

export const tokenManager = new TokenManager();
