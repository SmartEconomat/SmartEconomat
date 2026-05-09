type Callback = () => void;

class EventBus {
  private listeners: Record<string, Callback[]> = {};

  on(event: string, callback: Callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  emit(event: string) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => cb());
  }
}

/** Constantes públicas (eventBus) expuestas en smart-economat-frontend (SPA). */
export const eventBus = new EventBus();
/** Constantes públicas (AUTH_EVENTS) expuestas en smart-economat-frontend (SPA). */
export const AUTH_EVENTS = {
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  REFRESH_USER: 'AUTH_REFRESH_USER',
};

/** Constantes públicas (UI_EVENTS) expuestas en smart-economat-frontend (SPA). */
export const UI_EVENTS = {
  OPEN_NOTIFICATION_CENTER: 'UI_OPEN_NOTIFICATION_CENTER',
};
