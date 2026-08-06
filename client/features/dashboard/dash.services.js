import api from '@/lib/api';

export const getWorkspaces = async () => {
  try {
    const response = await api.get('/workspaces');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    throw error;
  }
};

export const createWorkspace = async ({ name }) => {
  try {
    const response = await api.post('/workspaces', { name });
    return response.data.data;
  } catch (error) {
    console.error('Error creating workspace:', error);
    throw error;
  }
};

export const getStudyInsights = async () => {
  try {
    const response = await api.get('/dashboard/insights');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching study insights:', error);
    throw error;
  }
};

export const getActivity = async () => {
  try {
    const response = await api.get('/dashboard/activity');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
};
