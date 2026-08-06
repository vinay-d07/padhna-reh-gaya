const multer = require('multer');
const uploadService = require('./services');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Only PDF, DOCX, PPTX, and TXT files are supported'));
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
    const { title } = req.body;
    const document = await uploadService.uploadDocument({
      workspaceId,
      clerkId: req.clerkId,
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

async function generateSummary(req, res) {
  try {
    const { workspaceId, documentId } = req.params;
    const summary = await uploadService.generateSummary({
      workspaceId,
      documentId,
      userId: req.dbUser.id,
    });
    return res.status(201).json({
      success: true,
      message: 'Summary generated successfully',
      data: summary,
    });
  } catch (error) {
    const statusCode = error.message === 'Document not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSummary(req, res) {
  try {
    const { workspaceId, documentId } = req.params;
    const summary = await uploadService.getSummary(workspaceId, documentId);
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Document not found' || error.message === 'Summary not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function generateFlashcards(req, res) {
  try {
    const { workspaceId, documentId } = req.params;
    const count = Math.min(Math.max(Number(req.body?.count) || 10, 1), 30);
    const flashcards = await uploadService.generateFlashcards({
      workspaceId,
      documentId,
      userId: req.dbUser.id,
      count,
    });
    return res.status(201).json({
      success: true,
      message: 'Flashcards generated successfully',
      data: flashcards,
    });
  } catch (error) {
    const statusCode = error.message === 'Document not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function getFlashcards(req, res) {
  try {
    const { workspaceId, documentId } = req.params;
    const flashcards = await uploadService.getFlashcards(workspaceId, documentId);
    return res.status(200).json({
      success: true,
      data: flashcards,
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
  generateSummary,
  getSummary,
  generateFlashcards,
  getFlashcards,
};
