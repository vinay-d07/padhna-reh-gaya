import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// Plain require() so vi.spyOn intercepts the calls socketHandlers.js's own
// require('./services') makes — see rooms/services.test.js.
const roomsService = require('./services');
const { trackEnter, trackExit } = require('./socketHandlers');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('trackEnter/trackExit presence counting', () => {
  it('does not end the session when one of two tabs for the same user closes', () => {
    const leaveSpy = vi.spyOn(roomsService, 'leaveRoom').mockResolvedValue();

    trackEnter('room_1', 'user_1'); // tab A
    trackEnter('room_1', 'user_1'); // tab B
    trackExit('room_1', 'user_1'); // tab A closes

    vi.advanceTimersByTime(20000);

    expect(leaveSpy).not.toHaveBeenCalled();
  });

  it('ends the session once the last tab closes and the grace period elapses', () => {
    const leaveSpy = vi.spyOn(roomsService, 'leaveRoom').mockResolvedValue();

    trackEnter('room_2', 'user_1');
    trackExit('room_2', 'user_1');

    expect(leaveSpy).not.toHaveBeenCalled(); // still inside the grace period
    vi.advanceTimersByTime(10000);
    expect(leaveSpy).toHaveBeenCalledWith({ roomId: 'room_2', userId: 'user_1' });
  });

  it('cancels the pending leave if the user reconnects within the grace period', () => {
    const leaveSpy = vi.spyOn(roomsService, 'leaveRoom').mockResolvedValue();

    trackEnter('room_3', 'user_1');
    trackExit('room_3', 'user_1'); // disconnect (e.g. network blip)
    vi.advanceTimersByTime(3000);
    trackEnter('room_3', 'user_1'); // reconnect before the grace period ends
    vi.advanceTimersByTime(20000);

    expect(leaveSpy).not.toHaveBeenCalled();
  });

  it('leaves immediately on an explicit exit, bypassing the grace period', () => {
    const leaveSpy = vi.spyOn(roomsService, 'leaveRoom').mockResolvedValue();

    trackEnter('room_4', 'user_1');
    trackExit('room_4', 'user_1', { immediate: true });

    expect(leaveSpy).toHaveBeenCalledWith({ roomId: 'room_4', userId: 'user_1' });
  });
});
