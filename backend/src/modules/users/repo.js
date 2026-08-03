const prisma = require('../../lib/prisma');

async function upsertUser(data) {
  return await prisma.user.upsert({
    where: { clerkId: data.clerkId },
    update: {
      email: data.email,
      name: data.name,
      imageUrl: data.imageUrl,
    },
    create: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
      imageUrl: data.imageUrl,
    },
  });
}

async function findUserByClerkId(clerkId) {
  return await prisma.user.findUnique({
    where: { clerkId },
  });
}

async function findUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

async function deleteUserByClerkId(clerkId) {
  return await prisma.user.delete({
    where: { clerkId },
  });
}

module.exports = {
  upsertUser,
  findUserByClerkId,
  findUserById,
  deleteUserByClerkId,
};
