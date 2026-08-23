const dashboardService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const insights = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStreakInsights({ clerkId: req.clerkId });
  return res.status(200).json({
    success: true,
    data,
  });
});

const activity = asyncHandler(async (req, res) => {
  const data = await dashboardService.getHeatmap({ clerkId: req.clerkId });
  return res.status(200).json({
    success: true,
    data,
  });
});

module.exports = {
  insights,
  activity,
};
