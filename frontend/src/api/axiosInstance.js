import axios from 'axios';
import { auth } from '../config/firebase';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

API.interceptors.request.use(async (req) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
