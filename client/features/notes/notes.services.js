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
  { title = 'Untitled note', content = '', conversationId } = {}
) => {
  try {
    const response = await api.post(`/workspaces/${workspaceId}/notes`, {
      title,
      content,
      conversationId,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const getNotesCountForConversation = async (conversationId) => {
  const response = await api.get(`/notes/conversations/${conversationId}/count`);
  return response.data.data.count;
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

export const restoreNote = async (noteId) => {
  try {
    const response = await api.post(`/notes/${noteId}/restore`);
    return response.data.data;
  } catch (error) {
    console.error('Error restoring note:', error);
    throw error;
  }
};
