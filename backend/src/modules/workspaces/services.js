const workspaceRepo = require('./repo');
const userRepo = require('../users/repo');

async function createWorkspace({ clerkId, name, description, icon, color, coverImage }) {
  if (!clerkId) {
    throw new Error('clerkId is required');
  }
  if (!name || !name.trim()) {
    throw new Error('name is required');
  }

  const owner = await userRepo.findUserByClerkId(clerkId);
  if (!owner) {
    throw new Error('User not found');
  }

  return await workspaceRepo.createWorkspace({
    name: name.trim(),
    description,
    icon,
    color,
    coverImage,
    ownerId: owner.id,
  });
}

async function listWorkspaces(clerkId) {
  if (!clerkId) {
    throw new Error('clerkId is required');
  }

  const owner = await userRepo.findUserByClerkId(clerkId);
  if (!owner) {
    throw new Error('User not found');
  }

  return await workspaceRepo.findWorkspacesByOwnerId(owner.id);
}

async function getWorkspace(id) {
  if (!id) {
    throw new Error('workspace id is required');
  }

  const workspace = await workspaceRepo.findWorkspaceById(id);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return workspace;
}

async function updateWorkspace(id, data) {
  if (!id) {
    throw new Error('workspace id is required');
  }

  const existing = await workspaceRepo.findWorkspaceById(id);
  if (!existing) {
    throw new Error('Workspace not found');
  }

  const { name, description, icon, color, coverImage } = data;
  const updateData = {};

  if (name !== undefined) {
    if (!name.trim()) {
      throw new Error('name cannot be empty');
    }
    updateData.name = name.trim();
  }
  if (description !== undefined) updateData.description = description;
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
  if (coverImage !== undefined) updateData.coverImage = coverImage;

  return await workspaceRepo.updateWorkspace(id, updateData);
}

async function deleteWorkspace(id) {
  if (!id) {
    throw new Error('workspace id is required');
  }

  const existing = await workspaceRepo.findWorkspaceById(id);
  if (!existing) {
    throw new Error('Workspace not found');
  }

  return await workspaceRepo.softDeleteWorkspace(id);
}

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
