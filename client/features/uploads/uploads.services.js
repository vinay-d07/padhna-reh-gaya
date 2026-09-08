import api from '@/lib/api';

export const uploadDocument = async (workspaceId, file, { onProgress } = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    // Override the instance's default JSON header so axios leaves the
    // FormData untouched and the browser can set the multipart boundary.
    const response = await api.post(`/workspaces/${workspaceId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (event) => {
            if (!event.total) return;
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const deleteDocument = async (workspaceId, documentId) => {
  try {
    await api.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const restoreDocument = async (workspaceId, documentId) => {
  try {
    const response = await api.post(`/workspaces/${workspaceId}/documents/${documentId}/restore`);
    return response.data.data;
  } catch (error) {
    console.error('Error restoring document:', error);
    throw error;
  }
};

export const retryDocument = async (workspaceId, documentId) => {
  try {
    const response = await api.post(`/workspaces/${workspaceId}/documents/${documentId}/retry`);
    return response.data.data;
  } catch (error) {
    console.error('Error retrying document ingestion:', error);
    throw error;
  }
};
