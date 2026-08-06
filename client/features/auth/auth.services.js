import api from '@/lib/api';

export const syncUserWithBackend = async (userData) => {
  try {
    const response = await api.post('/users/signup', {
      email: userData.email,
      name: userData.name,
      imageUrl: userData.imageUrl,
    });
    return response.data;
  } catch (error) {
    console.error('Error syncing user with backend:', error);
    throw error;
  }
};
