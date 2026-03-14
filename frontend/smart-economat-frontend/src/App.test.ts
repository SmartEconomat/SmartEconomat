import { describe, expect, it, vi } from 'vitest';
import { AUTH_EVENTS, eventBus } from './utils/eventBus';

describe('eventBus', () => {
  it('notifies registered listeners once per event emission', () => {
    const listener = vi.fn();

    eventBus.on(AUTH_EVENTS.UNAUTHORIZED, listener);
    eventBus.emit(AUTH_EVENTS.UNAUTHORIZED);
    eventBus.off(AUTH_EVENTS.UNAUTHORIZED, listener);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
