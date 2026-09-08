const userRepo = require('./repo');
const { seedSampleWorkspaceInBackground } = require('./sampleWorkspace');

async function signupOrSyncUser(userData) {
  if (!userData.clerkId || !userData.email) {
    throw new Error('clerkId and email are required for signup/sync');
  }

  const existing = await userRepo.findUserByClerkId(userData.clerkId);
  if (existing) {
    const user = await userRepo.updateUser(userData.clerkId, userData);
    return { user, isNewUser: false };
  }

  const user = await userRepo.createUser(userData);
  // Non-blocking — signup shouldn't wait on document ingestion, and a
  // failure here shouldn't fail the signup response itself.
  seedSampleWorkspaceInBackground(user);
  return { user, isNewUser: true };
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
