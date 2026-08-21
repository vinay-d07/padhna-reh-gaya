import { describe, it, expect, vi, afterEach } from 'vitest';

// Plain require() (not `import`) — see services.test.js for why: it's the
// only way to land on the same object instance access.js's own require()
// resolves to, so vi.spyOn actually intercepts the calls it makes.
const prisma = require('../lib/prisma');
const userRepo = require('../modules/users/repo');
const notesRepo = require('../modules/notes/repo');
const chatRepo = require('../modules/chat/repo');
const { requireWorkspaceRole, requireNoteRole, requireConversationRole } = require('./access');

const USER = { id: 'user_1', clerkId: 'clerk_1' };

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requireWorkspaceRole', () => {
  it('responds 400 when the workspaceId param is missing', async () => {
    const req = { params: {}, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireWorkspaceRole('VIEWER')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 404 when the authenticated user has no DB record', async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(null);
    const req = { params: { workspaceId: 'ws_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireWorkspaceRole('VIEWER')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when the user has no membership on the workspace', async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(USER);
    vi.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(null);
    const req = { params: { workspaceId: 'ws_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireWorkspaceRole('VIEWER')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when the membership role is below the required rank', async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(USER);
    vi.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({ role: 'VIEWER' });
    const req = { params: { workspaceId: 'ws_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireWorkspaceRole('EDITOR')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches dbUser/workspaceMembership when the role is sufficient', async () => {
    const membership = { role: 'OWNER' };
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(USER);
    vi.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(membership);
    const req = { params: { workspaceId: 'ws_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireWorkspaceRole('EDITOR')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.dbUser).toBe(USER);
    expect(req.workspaceMembership).toBe(membership);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows an exact role match (rank is >=, not >)', async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(USER);
    vi.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({ role: 'EDITOR' });
    const req = { params: { workspaceId: 'ws_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireWorkspaceRole('EDITOR')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('requireNoteRole', () => {
  it('responds 404 when the note does not exist', async () => {
    vi.spyOn(notesRepo, 'findNoteById').mockResolvedValue(null);
    const req = { params: { noteId: 'note_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireNoteRole('VIEWER')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('resolves the workspace via the note and enforces the role', async () => {
    vi.spyOn(notesRepo, 'findNoteById').mockResolvedValue({ id: 'note_1', workspaceId: 'ws_1' });
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(USER);
    vi.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({ role: 'VIEWER' });
    const req = { params: { noteId: 'note_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireNoteRole('EDITOR')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches req.note when the role is sufficient', async () => {
    const note = { id: 'note_1', workspaceId: 'ws_1' };
    vi.spyOn(notesRepo, 'findNoteById').mockResolvedValue(note);
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(USER);
    vi.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({ role: 'OWNER' });
    const req = { params: { noteId: 'note_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireNoteRole('VIEWER')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.note).toBe(note);
  });
});

describe('requireConversationRole', () => {
  it('responds 404 when the conversation does not exist', async () => {
    vi.spyOn(chatRepo, 'findConversationById').mockResolvedValue(null);
    const req = { params: { conversationId: 'conv_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireConversationRole('VIEWER')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches req.conversation when the role is sufficient', async () => {
    const conversation = { id: 'conv_1', workspaceId: 'ws_1' };
    vi.spyOn(chatRepo, 'findConversationById').mockResolvedValue(conversation);
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(USER);
    vi.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({ role: 'EDITOR' });
    const req = { params: { conversationId: 'conv_1' }, clerkId: 'clerk_1' };
    const res = mockRes();
    const next = vi.fn();

    await requireConversationRole('VIEWER')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.conversation).toBe(conversation);
  });
});
