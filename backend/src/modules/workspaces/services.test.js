import { describe, it, expect, vi, afterEach } from 'vitest';

// Plain require() here (not `import`) so this resolves through Node's own
// module cache to the exact same object `services.js`'s own require('./repo')
// gets — an ESM `import` of a CJS module gives Vite's synthetic namespace
// copy instead, and vi.spyOn on that copy never reaches the real singleton.
const workspaceRepo = require('./repo');
const userRepo = require('../users/repo');
const {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = require('./services');

const OWNER = { id: 'user_1', clerkId: 'clerk_1' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createWorkspace', () => {
  it('rejects a missing clerkId', async () => {
    await expect(createWorkspace({ clerkId: '', name: 'Bio' })).rejects.toThrow('clerkId is required');
  });

  it('rejects a blank name', async () => {
    await expect(createWorkspace({ clerkId: 'clerk_1', name: '   ' })).rejects.toThrow('name is required');
  });

  it('rejects when the owner does not exist', async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(null);
    await expect(createWorkspace({ clerkId: 'clerk_1', name: 'Bio' })).rejects.toThrow('User not found');
  });

  it('trims the name and creates the workspace under the resolved owner', async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(OWNER);
    const createSpy = vi
      .spyOn(workspaceRepo, 'createWorkspace')
      .mockResolvedValue({ id: 'ws_1', name: 'Bio 101' });

    const result = await createWorkspace({ clerkId: 'clerk_1', name: '  Bio 101  ', description: 'notes' });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Bio 101', ownerId: OWNER.id, description: 'notes' })
    );
    expect(result).toEqual({ id: 'ws_1', name: 'Bio 101' });
  });
});

describe('listWorkspaces', () => {
  it('rejects a missing clerkId', async () => {
    await expect(listWorkspaces()).rejects.toThrow('clerkId is required');
  });

  it('rejects when the owner does not exist', async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(null);
    await expect(listWorkspaces('clerk_1')).rejects.toThrow('User not found');
  });

  it("returns the owner's workspaces", async () => {
    vi.spyOn(userRepo, 'findUserByClerkId').mockResolvedValue(OWNER);
    const listSpy = vi.spyOn(workspaceRepo, 'findWorkspacesByOwnerId').mockResolvedValue([{ id: 'ws_1' }]);

    const result = await listWorkspaces('clerk_1');

    expect(listSpy).toHaveBeenCalledWith(OWNER.id);
    expect(result).toEqual([{ id: 'ws_1' }]);
  });
});

describe('getWorkspace', () => {
  it('rejects a missing id', async () => {
    await expect(getWorkspace()).rejects.toThrow('workspace id is required');
  });

  it('rejects when the workspace does not exist', async () => {
    vi.spyOn(workspaceRepo, 'findWorkspaceById').mockResolvedValue(null);
    await expect(getWorkspace('ws_1')).rejects.toThrow('Workspace not found');
  });

  it('returns the workspace', async () => {
    vi.spyOn(workspaceRepo, 'findWorkspaceById').mockResolvedValue({ id: 'ws_1' });
    await expect(getWorkspace('ws_1')).resolves.toEqual({ id: 'ws_1' });
  });
});

describe('updateWorkspace', () => {
  it('rejects a missing id', async () => {
    await expect(updateWorkspace(undefined, {})).rejects.toThrow('workspace id is required');
  });

  it('rejects when the workspace does not exist', async () => {
    vi.spyOn(workspaceRepo, 'findWorkspaceById').mockResolvedValue(null);
    await expect(updateWorkspace('ws_1', {})).rejects.toThrow('Workspace not found');
  });

  it('rejects a blank name', async () => {
    vi.spyOn(workspaceRepo, 'findWorkspaceById').mockResolvedValue({ id: 'ws_1', name: 'Old' });
    await expect(updateWorkspace('ws_1', { name: '   ' })).rejects.toThrow('name cannot be empty');
  });

  it('only forwards fields that were actually provided', async () => {
    vi.spyOn(workspaceRepo, 'findWorkspaceById').mockResolvedValue({ id: 'ws_1', name: 'Old' });
    const updateSpy = vi
      .spyOn(workspaceRepo, 'updateWorkspace')
      .mockResolvedValue({ id: 'ws_1', name: 'New', color: 'blue' });

    await updateWorkspace('ws_1', { name: '  New  ', color: 'blue' });

    expect(updateSpy).toHaveBeenCalledWith('ws_1', { name: 'New', color: 'blue' });
  });
});

describe('deleteWorkspace', () => {
  it('rejects a missing id', async () => {
    await expect(deleteWorkspace()).rejects.toThrow('workspace id is required');
  });

  it('rejects when the workspace does not exist', async () => {
    vi.spyOn(workspaceRepo, 'findWorkspaceById').mockResolvedValue(null);
    await expect(deleteWorkspace('ws_1')).rejects.toThrow('Workspace not found');
  });

  it('soft-deletes an existing workspace', async () => {
    vi.spyOn(workspaceRepo, 'findWorkspaceById').mockResolvedValue({ id: 'ws_1' });
    const deleteSpy = vi
      .spyOn(workspaceRepo, 'softDeleteWorkspace')
      .mockResolvedValue({ id: 'ws_1', deletedAt: new Date() });

    await deleteWorkspace('ws_1');

    expect(deleteSpy).toHaveBeenCalledWith('ws_1');
  });
});
