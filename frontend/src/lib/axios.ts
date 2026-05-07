import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    String(import.meta.env.VITE_ENVIRONMENT) === "development"
      ? "http://localhost:3000/api"
      : `${import.meta.env.VITE_PROD_URL}/api`,
});
