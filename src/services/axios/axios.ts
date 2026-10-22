import axios from "axios";
import Storage from "../storage/storage";
import { toast } from "sonner";

// Backend address per environment (dev, QA, UAT…), set in .env.local as VITE_API_BASE_URL — see .env.example
export const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

AxiosInstance.defaults.headers.post["Access-Control-Allow-Origin"] = "*";
AxiosInstance.defaults.headers.post["Access-Control-Allow-Headers"] =
  "Origin, X-Requested-With, Content-Type, Accept , Authorization";
AxiosInstance.defaults.headers.post["Access-Control-Allow-Credentials"] =
  "true";
AxiosInstance.defaults.headers.post["Access-Control-Allow-Methods"] =
  "GET,HEAD,OPTIONS,POST,PUT,OPTIONS";

// Using Interceptors so to send Access Token for every request
const storage = new Storage();

AxiosInstance.interceptors.request.use(
  async (config) => {
    if (!config.headers.Authorization) {
      let token = storage.getItem("token");
      
      // Fallback: try to get token from cookie if not in sessionStorage
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (err) => {
    console.error("Request Error:", err);
    return Promise.reject(err);
  }
);

AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If a 401 response is received, handle the logout
      storage.clearStorage();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errorMessage = error.response.data?.message || "An error occurred";

      if (error.response && error.response.status === 401) {
        // Handle 401 Unauthorized by clearing storage and redirecting to login
        storage.clearStorage();
        window.location.href = "/login";
      } else if (error.response.status === 403) {
        // Handle 403 Forbidden by displaying a toast message
        toast.error(
          errorMessage || "You do not have permission to access this resource."
        );
      } else {
        // Display other error messages in a toast
        toast.error(errorMessage);
      }
    }
    return Promise.reject(error);
  }
);
