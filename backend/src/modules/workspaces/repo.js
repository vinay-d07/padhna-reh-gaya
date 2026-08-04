const prisma = require('../../lib/prisma');

async function createWorkspace(data) {
  return await prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      coverImage: data.coverImage,
      ownerId: data.ownerId,
      members: {
        create: {
          userId: data.ownerId,
          role: 'OWNER',
        },
      },
    },
  });
}

async function findWorkspacesByOwnerId(ownerId) {
  return await prisma.workspace.findMany({
    // MongoDB never sets deletedAt on creation, so it's absent rather than
    // null — `isSet: false` matches that; a plain `deletedAt: null` filter
    // only matches documents where the field is explicitly set to null.
    where: { ownerId, deletedAt: { isSet: false } },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { documents: true } },
    },
  });
}

async function findWorkspaceById(id) {
  return await prisma.workspace.findFirst({
    where: { id, deletedAt: { isSet: false } },
    include: {
      _count: { select: { documents: true } },
    },
  });
}

async function updateWorkspace(id, data) {
  return await prisma.workspace.update({
    where: { id },
    data,
  });
}

async function softDeleteWorkspace(id) {
  return await prisma.workspace.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

module.exports = {
  createWorkspace,
  findWorkspacesByOwnerId,
  findWorkspaceById,
  updateWorkspace,
  softDeleteWorkspace,
};
