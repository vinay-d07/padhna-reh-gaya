const { randomUUID } = require('crypto');
const { supabase, DOCUMENTS_BUCKET, ensureBucket } = require('../../lib/supabase');
const uploadsRepo = require('./repo');
const workspaceRepo = require('../workspaces/repo');
const userRepo = require('../users/repo');

const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

async function uploadDocument({ workspaceId, clerkId, file, title }) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  if (!clerkId) {
    throw new Error('clerkId is required');
  }
  if (!file) {
    throw new Error('file is required');
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error('Only PDF files are supported');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 25MB size limit');
  }

  const workspace = await workspaceRepo.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const uploader = await userRepo.findUserByClerkId(clerkId);
  if (!uploader) {
    throw new Error('User not found');
  }

  await ensureBucket();

  const storageKey = `${workspaceId}/${randomUUID()}-${sanitizeFileName(file.originalname)}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storageKey, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  try {
    return await uploadsRepo.createDocument({
      workspaceId,
      uploadedById: uploader.id,
      title: title?.trim() || file.originalname,
      fileName: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      vectorNamespace: `doc_${randomUUID()}`,
      status: 'READY',
    });
  } catch (dbError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storageKey]);
    throw dbError;
  }
}

async function listDocuments(workspaceId) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }

  const workspace = await workspaceRepo.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return await uploadsRepo.findDocumentsByWorkspaceId(workspaceId);
}

async function deleteDocument(workspaceId, documentId) {
  if (!documentId) {
    throw new Error('document id is required');
  }

  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new Error('Document not found');
  }

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.storageKey]);
  return await uploadsRepo.softDeleteDocument(documentId);
}

module.exports = {
  uploadDocument,
  listDocuments,
  deleteDocument,
};
