import api from '@/lib/api';

export const getSummary = async (workspaceId, documentId) => {
  const response = await api.get(`/workspaces/${workspaceId}/documents/${documentId}/summary`);
  return response.data.data;
};

export const generateSummary = async (workspaceId, documentId) => {
  const response = await api.post(`/workspaces/${workspaceId}/documents/${documentId}/summary`);
  return response.data.data;
};

export const getFlashcards = async (workspaceId, documentId) => {
  const response = await api.get(`/workspaces/${workspaceId}/documents/${documentId}/flashcards`);
  return response.data.data;
};

export const generateFlashcards = async (workspaceId, documentId, count = 10) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/documents/${documentId}/flashcards`,
    { count }
  );
  return response.data.data;
};

export const getQuiz = async (workspaceId, documentId) => {
  const response = await api.get(`/workspaces/${workspaceId}/documents/${documentId}/quiz`);
  return response.data.data;
};

export const generateQuiz = async (workspaceId, documentId, count = 5) => {
  const response = await api.post(`/workspaces/${workspaceId}/documents/${documentId}/quiz`, { count });
  return response.data.data;
};

export const submitQuizAttempt = async (workspaceId, documentId, answers) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/documents/${documentId}/quiz/attempts`,
    { answers }
  );
  return response.data.data;
};
