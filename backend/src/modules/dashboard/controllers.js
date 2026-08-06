const dashboardService = require('./services');

async function insights(req, res) {
  try {
    const data = await dashboardService.getStreakInsights({ clerkId: req.clerkId });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function activity(req, res) {
  try {
    const data = await dashboardService.getHeatmap({ clerkId: req.clerkId });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  insights,
  activity,
};
