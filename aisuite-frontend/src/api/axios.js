import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-suite-9bvf.onrender.com", // change to your backend URL
});

// Attach JWT token automatically if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
