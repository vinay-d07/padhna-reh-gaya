const multer = require('multer');
const uploadService = require('./services');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are supported'));
    }
    cb(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next();
  });
}

async function create(req, res) {
  try {
    const { workspaceId } = req.params;
    const { clerkId, title } = req.body;
    const document = await uploadService.uploadDocument({
      workspaceId,
      clerkId,
      title,
      file: req.file,
    });
    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
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
    const documents = await uploadService.listDocuments(workspaceId);
    return res.status(200).json({
      success: true,
      data: documents,
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
    const { workspaceId, documentId } = req.params;
    await uploadService.deleteDocument(workspaceId, documentId);
    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    const statusCode = error.message === 'Document not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  handleUpload,
  create,
  list,
  remove,
};
