const userService = require('./services');

async function signup(req, res) {
  try {
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
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getProfile(req, res) {
  try {
    const { clerkId } = req.params;
    if (clerkId !== req.clerkId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const user = await userService.getUserByClerkId(clerkId);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteProfile(req, res) {
  try {
    const { clerkId } = req.params;
    if (clerkId !== req.clerkId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await userService.deleteUser(clerkId);
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  signup,
  getProfile,
  deleteProfile,
};
