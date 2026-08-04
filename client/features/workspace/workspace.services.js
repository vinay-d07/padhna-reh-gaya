import api from '@/lib/api';

export const getWorkspace = async (workspaceId) => {
  try {
    const response = await api.get(`/workspaces/${workspaceId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching workspace:', error);
    throw error;
  }
};

export const updateWorkspace = async (workspaceId, data) => {
  try {
    const response = await api.patch(`/workspaces/${workspaceId}`, data);
    return response.data.data;
  } catch (error) {
    console.error('Error updating workspace:', error);
    throw error;
  }
};

export const deleteWorkspace = async (workspaceId) => {
  try {
    await api.delete(`/workspaces/${workspaceId}`);
  } catch (error) {
    console.error('Error deleting workspace:', error);
    throw error;
  }
};

export const getWorkspaceDocuments = async (workspaceId) => {
  try {
    const response = await api.get(`/workspaces/${workspaceId}/documents`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching workspace documents:', error);
    throw error;
  }
};
