import { describe, it, expect, vi, afterEach } from 'vitest';

// Plain require() (not `import`) so vi.spyOn intercepts the calls
// services.js's own require() makes — see uploads/services.test.js.
const roomsRepo = require('./repo');
const sessionsRepo = require('../studySessions/repo');
const sessionsService = require('../studySessions/services');
const dashboardService = require('../dashboard/services');
const socketLib = require('../../lib/socket');
const {
  listRooms,
  createRoom,
  lookupRoomByCode,
  getRoomDetail,
  deleteRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  listMessages,
} = require('./services');

afterEach(() => {
  vi.restoreAllMocks();
});

const ROOM = { id: 'room_1', name: 'Morning grind', createdById: 'user_1', isPrivate: false };
const PRIVATE_ROOM = { id: 'room_2', name: 'Locked in', createdById: 'user_1', isPrivate: true, joinCode: 'ABC123' };

describe('listRooms', () => {
  it('attaches a live participant count to each room', async () => {
    vi.spyOn(roomsRepo, 'findPublicRooms').mockResolvedValue([ROOM, { id: 'room_3', name: 'Late night' }]);
    vi.spyOn(roomsRepo, 'countActiveParticipants').mockResolvedValueOnce(3).mockResolvedValueOnce(0);

    const rooms = await listRooms();

    expect(rooms).toEqual([
      { ...ROOM, participantCount: 3 },
      { id: 'room_3', name: 'Late night', participantCount: 0 },
    ]);
  });
});

describe('createRoom', () => {
  it('generates a join code for a private room but not a public one', async () => {
    const createSpy = vi.spyOn(roomsRepo, 'createRoom').mockImplementation(async (data) => data);
    vi.spyOn(roomsRepo, 'findRoomByCode').mockResolvedValue(null);

    const publicRoom = await createRoom({ name: 'Public', createdById: 'user_1', isPrivate: false });
    expect(publicRoom.joinCode).toBeNull();

    const privateRoom = await createRoom({ name: 'Private', createdById: 'user_1', isPrivate: true });
    expect(privateRoom.joinCode).toMatch(/^[0-9A-F]{6}$/);

    expect(createSpy).toHaveBeenCalledTimes(2);
  });

  it('retries code generation on a collision', async () => {
    vi.spyOn(roomsRepo, 'createRoom').mockImplementation(async (data) => data);
    const lookupSpy = vi
      .spyOn(roomsRepo, 'findRoomByCode')
      .mockResolvedValueOnce({ id: 'room_taken' }) // first code is taken
      .mockResolvedValueOnce(null); // second code is free

    const room = await createRoom({ name: 'Private', createdById: 'user_1', isPrivate: true });

    expect(lookupSpy).toHaveBeenCalledTimes(2);
    expect(room.joinCode).toMatch(/^[0-9A-F]{6}$/);
  });
});

describe('lookupRoomByCode', () => {
  it('rejects when no room has that code', async () => {
    vi.spyOn(roomsRepo, 'findRoomByCode').mockResolvedValue(null);
    await expect(lookupRoomByCode('NOPE12')).rejects.toThrow('No room found with that code');
  });

  it('resolves a code to its room id and name', async () => {
    vi.spyOn(roomsRepo, 'findRoomByCode').mockResolvedValue(PRIVATE_ROOM);
    await expect(lookupRoomByCode('ABC123')).resolves.toEqual({ id: 'room_2', name: 'Locked in' });
  });
});

describe('getRoomDetail', () => {
  it('rejects when the room does not exist', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(null);
    await expect(getRoomDetail('room_x', { requesterId: 'user_1' })).rejects.toThrow('Room not found');
  });

  it('only attaches an active session if it belongs to this room', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(ROOM);
    vi.spyOn(roomsRepo, 'findActiveParticipantsByRoom').mockResolvedValue([
      { userId: 'user_1', joinedAt: new Date(), topic: null, user: { id: 'user_1', name: 'A', imageUrl: null } },
      { userId: 'user_2', joinedAt: new Date(), topic: null, user: { id: 'user_2', name: 'B', imageUrl: null } },
    ]);
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser')
      .mockResolvedValueOnce({ id: 'sess_1', roomId: 'room_1', startedAt: new Date() }) // user_1: this room
      .mockResolvedValueOnce({ id: 'sess_2', roomId: 'room_other', startedAt: new Date() }); // user_2: elsewhere

    const detail = await getRoomDetail('room_1', { requesterId: 'user_1' });

    expect(detail.participants[0].activeSession).toEqual(
      expect.objectContaining({ id: 'sess_1' })
    );
    expect(detail.participants[1].activeSession).toBeNull();
  });

  it('returns a locked summary (no participants, no code) for a private room a stranger has not joined', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(PRIVATE_ROOM);
    vi.spyOn(roomsRepo, 'findParticipant').mockResolvedValue(null);

    const detail = await getRoomDetail('room_2', { requesterId: 'user_stranger' });

    expect(detail).toEqual({
      id: 'room_2',
      name: 'Locked in',
      description: undefined,
      isPrivate: true,
      locked: true,
    });
  });

  it('unlocks a private room given the correct join code, without ever returning the code itself', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(PRIVATE_ROOM);
    vi.spyOn(roomsRepo, 'findParticipant').mockResolvedValue(null);
    vi.spyOn(roomsRepo, 'findActiveParticipantsByRoom').mockResolvedValue([]);

    const detail = await getRoomDetail('room_2', { requesterId: 'user_stranger', code: 'ABC123' });

    expect(detail.locked).toBe(false);
    expect(detail.joinCode).toBeUndefined();
  });

  it('gives the creator their own join code back', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(PRIVATE_ROOM);
    vi.spyOn(roomsRepo, 'findActiveParticipantsByRoom').mockResolvedValue([]);

    const detail = await getRoomDetail('room_2', { requesterId: 'user_1' });

    expect(detail.joinCode).toBe('ABC123');
  });
});

describe('deleteRoom', () => {
  it('rejects when the caller is not the room creator', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(ROOM);
    await expect(deleteRoom('room_1', 'user_other')).rejects.toThrow(
      'Only the room creator can delete this room'
    );
  });
});

describe('joinRoom', () => {
  it('rejects when the room does not exist', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(null);
    await expect(joinRoom({ roomId: 'room_x', userId: 'user_1' })).rejects.toThrow('Room not found');
  });

  it('rejects a private room join with a wrong or missing code', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(PRIVATE_ROOM);
    vi.spyOn(roomsRepo, 'findParticipant').mockResolvedValue(null);

    await expect(
      joinRoom({ roomId: 'room_2', userId: 'user_stranger', code: 'WRONG' })
    ).rejects.toThrow('Invalid join code');
  });

  it('lets the creator into their own private room without a code', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(PRIVATE_ROOM);
    vi.spyOn(roomsRepo, 'upsertParticipant').mockResolvedValue({ roomId: 'room_2', userId: 'user_1', joinedAt: new Date(), topic: null });
    vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue(null);

    await expect(joinRoom({ roomId: 'room_2', userId: 'user_1' })).resolves.toBeTruthy();
  });

  it('upserts presence with the given topic and records a ROOM_JOINED activity', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(ROOM);
    const upsertSpy = vi
      .spyOn(roomsRepo, 'upsertParticipant')
      .mockResolvedValue({ roomId: 'room_1', userId: 'user_1', joinedAt: new Date(), topic: 'Organic chemistry' });
    const activitySpy = vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue(null);

    await joinRoom({ roomId: 'room_1', userId: 'user_1', topic: 'Organic chemistry' });

    expect(upsertSpy).toHaveBeenCalledWith('room_1', 'user_1', 'Organic chemistry');
    expect(activitySpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', type: 'ROOM_JOINED' })
    );
  });

  // Regression test for the "old person's timer disappears when someone
  // else joins" bug: the join broadcast must reflect a session the joining
  // user already has running in this room (e.g. a reconnect), not assume
  // null.
  it('includes the joining user\'s already-running session in the presence broadcast', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(ROOM);
    vi.spyOn(roomsRepo, 'upsertParticipant').mockResolvedValue({
      roomId: 'room_1',
      userId: 'user_1',
      joinedAt: new Date(),
      topic: null,
    });
    vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});
    const startedAt = new Date();
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue({
      id: 'sess_1',
      roomId: 'room_1',
      startedAt,
    });

    const emitSpy = vi.spyOn(socketLib, 'emitToRoom').mockImplementation(() => {});

    await joinRoom({ roomId: 'room_1', userId: 'user_1' });

    expect(emitSpy).toHaveBeenCalledWith(
      'room_1',
      'presence:joined',
      expect.objectContaining({ activeSession: { id: 'sess_1', startedAt } })
    );
  });
});

describe('leaveRoom', () => {
  it('ends an active session tied to this room', async () => {
    vi.spyOn(roomsRepo, 'markParticipantLeft').mockResolvedValue({ count: 1 });
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue({
      id: 'sess_1',
      roomId: 'room_1',
    });
    const endSpy = vi.spyOn(sessionsService, 'endSessionById').mockResolvedValue({});
    vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});

    await leaveRoom({ roomId: 'room_1', userId: 'user_1' });

    expect(endSpy).toHaveBeenCalledWith('sess_1', 'user_1');
  });

  it('leaves the session alone if it belongs to a different room', async () => {
    vi.spyOn(roomsRepo, 'markParticipantLeft').mockResolvedValue({ count: 1 });
    vi.spyOn(sessionsRepo, 'findActiveSessionForUser').mockResolvedValue({
      id: 'sess_1',
      roomId: 'room_other',
    });
    const endSpy = vi.spyOn(sessionsService, 'endSessionById').mockResolvedValue({});
    vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});

    await leaveRoom({ roomId: 'room_1', userId: 'user_1' });

    expect(endSpy).not.toHaveBeenCalled();
  });
});

describe('sendMessage', () => {
  it('rejects a stranger sending into a private room', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(PRIVATE_ROOM);
    vi.spyOn(roomsRepo, 'findParticipant').mockResolvedValue(null);

    await expect(
      sendMessage({ roomId: 'room_2', userId: 'user_stranger', content: 'hi' })
    ).rejects.toThrow('This room is private');
  });

  it('persists and broadcasts a message for a member', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(ROOM);
    vi.spyOn(roomsRepo, 'createMessage').mockResolvedValue({
      id: 'msg_1',
      content: 'hello',
      createdAt: new Date(),
      user: { name: 'Ada', imageUrl: null },
    });

    const result = await sendMessage({ roomId: 'room_1', userId: 'user_1', content: '  hello  ' });

    expect(result).toEqual(
      expect.objectContaining({ id: 'msg_1', roomId: 'room_1', userId: 'user_1', content: 'hello', name: 'Ada' })
    );
  });
});

describe('listMessages', () => {
  it('rejects a stranger reading a private room\'s history', async () => {
    vi.spyOn(roomsRepo, 'findRoomById').mockResolvedValue(PRIVATE_ROOM);
    vi.spyOn(roomsRepo, 'findParticipant').mockResolvedValue(null);

    await expect(listMessages('room_2', { requesterId: 'user_stranger' })).rejects.toThrow(
      'This room is private'
    );
  });
});
