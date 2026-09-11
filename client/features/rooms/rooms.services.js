import api from '@/lib/api';

export const listRooms = async () => {
  const response = await api.get('/rooms');
  return response.data.data;
};

export const createRoom = async ({ name, description, isPrivate }) => {
  const response = await api.post('/rooms', { name, description, isPrivate });
  return response.data.data;
};

export const lookupRoomByCode = async (code) => {
  const response = await api.get('/rooms/lookup', { params: { code } });
  return response.data.data;
};

export const getRoom = async (roomId, code) => {
  const response = await api.get(`/rooms/${roomId}`, { params: code ? { code } : undefined });
  return response.data.data;
};

export const deleteRoom = async (roomId) => {
  const response = await api.delete(`/rooms/${roomId}`);
  return response.data;
};

export const joinRoom = async (roomId, { code, topic } = {}) => {
  const response = await api.post(`/rooms/${roomId}/join`, { code, topic });
  return response.data.data;
};

export const leaveRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/leave`);
  return response.data;
};

export const getRoomMessages = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/messages`);
  return response.data.data;
};

export const sendRoomMessage = async (roomId, content) => {
  const response = await api.post(`/rooms/${roomId}/messages`, { content });
  return response.data.data;
};

export const reactToRoomMessage = async (roomId, messageId, emoji) => {
  const response = await api.post(`/rooms/${roomId}/messages/${messageId}/reactions`, { emoji });
  return response.data.data;
};

export const startStudySession = async (roomId) => {
  const response = await api.post('/study-sessions', roomId ? { roomId } : {});
  return response.data.data;
};

export const endStudySession = async (sessionId) => {
  const response = await api.patch(`/study-sessions/${sessionId}/end`);
  return response.data.data;
};

export const getActiveStudySession = async () => {
  const response = await api.get('/study-sessions/active');
  return response.data.data;
};

export const listStudySessions = async (page = 1, limit = 20) => {
  const response = await api.get('/study-sessions', { params: { page, limit } });
  return response.data.data;
};
