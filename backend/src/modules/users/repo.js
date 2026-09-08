const prisma = require('../../lib/prisma');

async function createUser(data) {
  return await prisma.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
      imageUrl: data.imageUrl,
    },
  });
}

async function updateUser(clerkId, data) {
  return await prisma.user.update({
    where: { clerkId },
    data: {
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
  createUser,
  updateUser,
  findUserByClerkId,
  findUserById,
  deleteUserByClerkId,
};
