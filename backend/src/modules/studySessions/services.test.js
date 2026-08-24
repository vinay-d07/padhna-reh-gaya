import { describe, it, expect, vi, afterEach } from 'vitest';

// Plain require() (not `import`) so vi.spyOn intercepts the calls
// services.js's own require('./repo') makes — see uploads/services.test.js.
const sessionsRepo = require('./repo');
const roomsRepo = require('../rooms/repo');
const dashboardService = require('../dashboard/services');
const { startSession, endSessionById, getActiveSession } = require('./services');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('startSession', () => {
  it('rejects when the user already has an active session', async () => {
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue({ id: 'sess_1' });
    await expect(startSession({ userId: 'user_1' })).rejects.toThrow(
      'You already have an active study session'
    );
  });

  it('rejects when roomId points at a room that does not exist', async () => {
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue(null);
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(null);
    await expect(startSession({ userId: 'user_1', roomId: 'room_x' })).rejects.toThrow('Room not found');
  });

  it('creates a session and records an activity when no room is given', async () => {
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue(null);
    const createSpy = vi
      .spyOn(sessionsRepo, 'createSession')
      .mockResolvedValue({ id: 'sess_1', startedAt: new Date() });
    const activitySpy = vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});

    const session = await startSession({ userId: 'user_1' });

    expect(createSpy).toHaveBeenCalledWith({ userId: 'user_1', roomId: null });
    expect(activitySpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', type: 'STUDY_SESSION_STARTED' })
    );
    expect(session.id).toBe('sess_1');
  });
});

describe('endSessionById', () => {
  it('rejects when the session does not exist', async () => {
    vi.spyOn(sessionsRepo, 'findSessionById').mockResolvedValue(null);
    await expect(endSessionById('sess_x', 'user_1')).rejects.toThrow('Study session not found');
  });

  it('rejects when the session belongs to a different user', async () => {
    vi.spyOn(sessionsRepo, 'findSessionById').mockResolvedValue({ id: 'sess_1', userId: 'user_other' });
    await expect(endSessionById('sess_1', 'user_1')).rejects.toThrow('Study session not found');
  });

  it('is idempotent — returns an already-ended session unchanged, no double activity', async () => {
    const ended = { id: 'sess_1', userId: 'user_1', endedAt: new Date(), durationSeconds: 120 };
    vi.spyOn(sessionsRepo, 'findSessionById').mockResolvedValue(ended);
    const activitySpy = vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});

    const result = await endSessionById('sess_1', 'user_1');

    expect(result).toEqual(ended);
    expect(activitySpy).not.toHaveBeenCalled();
  });

  it('computes duration, persists it, and records an activity', async () => {
    const startedAt = new Date(Date.now() - 60000);
    vi.spyOn(sessionsRepo, 'findSessionById').mockResolvedValue({
      id: 'sess_1',
      userId: 'user_1',
      roomId: null,
      startedAt,
      endedAt: null,
    });
    const endSpy = vi.spyOn(sessionsRepo, 'endSession').mockImplementation(async (id, data) => ({
      id,
      ...data,
    }));
    const activitySpy = vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});

    const result = await endSessionById('sess_1', 'user_1');

    expect(endSpy).toHaveBeenCalledWith('sess_1', expect.objectContaining({ durationSeconds: expect.any(Number) }));
    expect(result.durationSeconds).toBeGreaterThanOrEqual(59);
    expect(activitySpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', type: 'STUDY_SESSION_ENDED' })
    );
  });
});

describe('getActiveSession', () => {
  it('delegates to the repo', async () => {
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue(null);
    const result = await getActiveSession('user_1');
    expect(result).toBeNull();
  });
});
