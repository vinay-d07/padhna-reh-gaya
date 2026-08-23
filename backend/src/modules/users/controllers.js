const userService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  const { email, name, imageUrl } = req.body;
  const user = await userService.signupOrSyncUser({
    clerkId: req.clerkId,
    email,
    name,
    imageUrl,
  });
  return res.status(201).json({
    success: true,
    message: 'User synced successfully',
    data: user,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const { clerkId } = req.params;
  if (clerkId !== req.clerkId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const user = await userService.getUserByClerkId(clerkId);
  return res.status(200).json({
    success: true,
    data: user,
  });
});

const deleteProfile = asyncHandler(async (req, res) => {
  const { clerkId } = req.params;
  if (clerkId !== req.clerkId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  await userService.deleteUser(clerkId);
  return res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  signup,
  getProfile,
  deleteProfile,
};
