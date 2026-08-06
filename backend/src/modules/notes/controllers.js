const noteService = require('./services');

async function create(req, res) {
  try {
    const { workspaceId } = req.params;
    const { title, content } = req.body;
    const note = await noteService.createNote({ workspaceId, clerkId: req.clerkId, title, content });
    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Workspace not found' || error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function list(req, res) {
  try {
    const { workspaceId } = req.params;
    const notes = await noteService.listNotes(workspaceId);
    return res.status(200).json({
      success: true,
      data: notes,
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
    const { noteId } = req.params;
    const note = await noteService.updateNote(noteId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: note,
    });
  } catch (error) {
    const statusCode = error.message === 'Note not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function remove(req, res) {
  try {
    const { noteId } = req.params;
    await noteService.deleteNote(noteId);
    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    const statusCode = error.message === 'Note not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  create,
  list,
  update,
  remove,
};
