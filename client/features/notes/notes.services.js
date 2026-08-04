import api from '@/lib/api';

export const getNotes = async (workspaceId) => {
  try {
    const response = await api.get(`/workspaces/${workspaceId}/notes`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

export const createNote = async (
  workspaceId,
  clerkId,
  { title = 'Untitled note', content = '' } = {}
) => {
  try {
    const response = await api.post(`/workspaces/${workspaceId}/notes`, {
      clerkId,
      title,
      content,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const updateNote = async (noteId, { title, content }) => {
  try {
    const response = await api.patch(`/notes/${noteId}`, { title, content });
    return response.data.data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId) => {
  try {
    await api.delete(`/notes/${noteId}`);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};
