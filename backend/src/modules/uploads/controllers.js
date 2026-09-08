const multer = require('multer');
const uploadService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

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

const create = asyncHandler(async (req, res) => {
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
});

const list = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const documents = await uploadService.listDocuments(workspaceId);
  return res.status(200).json({
    success: true,
    data: documents,
  });
});

const remove = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  await uploadService.deleteDocument(workspaceId, documentId);
  return res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
  });
});

const restore = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const document = await uploadService.restoreDocument(workspaceId, documentId);
  return res.status(200).json({
    success: true,
    message: 'Document restored successfully',
    data: document,
  });
});

const retryIngestion = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const document = await uploadService.retryIngestion(workspaceId, documentId);
  return res.status(200).json({
    success: true,
    message: 'Ingestion re-queued',
    data: document,
  });
});

const generateSummary = asyncHandler(async (req, res) => {
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
});

const getSummary = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const summary = await uploadService.getSummary(workspaceId, documentId);
  return res.status(200).json({
    success: true,
    data: summary,
  });
});

const generateFlashcards = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const count = req.body?.count ?? 10;
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
});

const getFlashcards = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const flashcards = await uploadService.getFlashcards(workspaceId, documentId);
  return res.status(200).json({
    success: true,
    data: flashcards,
  });
});

const generateQuiz = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const count = req.body?.count ?? 5;
  const quiz = await uploadService.generateQuiz({
    workspaceId,
    documentId,
    userId: req.dbUser.id,
    count,
  });
  return res.status(201).json({
    success: true,
    message: 'Quiz generated successfully',
    data: quiz,
  });
});

const getQuiz = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const quiz = await uploadService.getQuiz(workspaceId, documentId);
  return res.status(200).json({
    success: true,
    data: quiz,
  });
});

const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { workspaceId, documentId } = req.params;
  const { answers } = req.body;
  const result = await uploadService.submitQuizAttempt({
    workspaceId,
    documentId,
    userId: req.dbUser.id,
    answers,
  });
  return res.status(201).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: result,
  });
});

module.exports = {
  handleUpload,
  create,
  list,
  remove,
  restore,
  retryIngestion,
  generateSummary,
  getSummary,
  generateFlashcards,
  getFlashcards,
  generateQuiz,
  getQuiz,
  submitQuizAttempt,
};
