const workspaceService = require('./services');

async function create(req, res) {
  try {
    const { clerkId, name, description, icon, color, coverImage } = req.body;
    const workspace = await workspaceService.createWorkspace({
      clerkId,
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
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function list(req, res) {
  try {
    const { clerkId } = req.query;
    const workspaces = await workspaceService.listWorkspaces(clerkId);
    return res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;
    const workspace = await workspaceService.getWorkspace(id);
    return res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    const statusCode = error.message === 'Workspace not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const workspace = await workspaceService.updateWorkspace(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: workspace,
    });
  } catch (error) {
    const statusCode = error.message === 'Workspace not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    await workspaceService.deleteWorkspace(id);
    return res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    const statusCode = error.message === 'Workspace not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
