const workspaceService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const { name, description, icon, color, coverImage } = req.body;
  const workspace = await workspaceService.createWorkspace({
    clerkId: req.clerkId,
    name,
    description,
    icon,
    color,
    coverImage,
  });
  return res.status(201).json({
    success: true,
    message: 'Workspace created successfully',
    data: workspace,
  });
});

const list = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.listWorkspaces(req.clerkId);
  return res.status(200).json({
    success: true,
    data: workspaces,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workspace = await workspaceService.getWorkspace(id);
  return res.status(200).json({
    success: true,
    data: workspace,
  });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workspace = await workspaceService.updateWorkspace(id, req.body);
  return res.status(200).json({
    success: true,
    message: 'Workspace updated successfully',
    data: workspace,
  });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await workspaceService.deleteWorkspace(id);
  return res.status(200).json({
    success: true,
    message: 'Workspace deleted successfully',
  });
});

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
