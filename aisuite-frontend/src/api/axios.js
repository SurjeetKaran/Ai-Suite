// import axios from "axios";

// const API = axios.create({
//   // baseURL: "https://ai-suite-9bvf.onrender.com", // change to your backend URL
//   baseURL: "http://localhost:5000",
// });

// // Attach JWT token automatically if present
// API.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export default API;
import axios from "axios";
import log from "../utils/logger";

const API = axios.create({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:5000"  // Dev
      : "https://ai-suite-9bvf.onrender.com", // Production
});

// Attach JWT token automatically if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  log('INFO', `API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Response logging
API.interceptors.response.use(
  (response) => {
    try {
      log('INFO', `API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, { status: response.status });
    } catch (e) {}
    return response;
  },
  (error) => {
    const cfg = error.config || {};
    // Normalize backend error payloads so frontend can read `.message`
    try {
      const respData = error.response?.data;
      if (respData && typeof respData === 'object') {
        // Ensure `message` exists (some endpoints return `msg`)
        if (!respData.message && respData.msg) respData.message = respData.msg;
        // Attach a normalizedMessage shortcut
        error.normalizedMessage = respData.message || error.message;
        error.normalizedData = respData;
      } else {
        error.normalizedMessage = error.message;
      }
    } catch (e) {
      error.normalizedMessage = error.message;
    }

    log('ERROR', `API Error: ${cfg.method ? cfg.method.toUpperCase() : ''} ${cfg.url || ''}`, { message: error.normalizedMessage, status: error.response?.status, data: error.response?.data });
    return Promise.reject(error);
  }
);

export default API;
