import axios from 'axios';

const API = axios.create({
  baseURL: 'https://archives-api-tqrc.onrender.com/api',
});

// Automatically attach JWT token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Automatically handle expired tokens (401 errors)
API.interceptors.response.use(
  (response) => response, // If the request succeeds, just return the response
  (error) => {
    // If the server says the token is invalid/expired
    if (error.response && error.response.status === 401) {
      localStorage.clear(); // Wipe the dead token and user data
      window.location.href = '/login'; // Force redirect to login
    }
    return Promise.reject(error);
  }
);

export default API;