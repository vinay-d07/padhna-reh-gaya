import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// The backend verifies this token on every request rather than trusting a
// clerkId in the body/query, so every call needs it attached.
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
