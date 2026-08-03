const userRepo = require('./repo');

async function signupOrSyncUser(userData) {
  if (!userData.clerkId || !userData.email) {
    throw new Error('clerkId and email are required for signup/sync');
  }
  return await userRepo.upsertUser(userData);
}

async function getUserByClerkId(clerkId) {
  if (!clerkId) {
    throw new Error('clerkId is required');
  }
  const user = await userRepo.findUserByClerkId(clerkId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function deleteUser(clerkId) {
  if (!clerkId) {
    throw new Error('clerkId is required');
  }
  return await userRepo.deleteUserByClerkId(clerkId);
}

module.exports = {
  signupOrSyncUser,
  getUserByClerkId,
  deleteUser,
};
