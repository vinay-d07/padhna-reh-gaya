import api from '@/lib/api';

export const getReviewQueue = async (workspaceId, limit = 20) => {
  const response = await api.get(`/workspaces/${workspaceId}/review/queue`, { params: { limit } });
  return response.data.data;
};

export const getReviewStats = async (workspaceId) => {
  const response = await api.get(`/workspaces/${workspaceId}/review/stats`);
  return response.data.data;
};

export const gradeFlashcard = async (workspaceId, flashcardId, grade) => {
  const response = await api.post(`/workspaces/${workspaceId}/review/${flashcardId}`, { grade });
  return response.data.data;
};
