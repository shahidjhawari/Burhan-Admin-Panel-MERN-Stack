import axios from "axios";

// Change this if your backend runs on a different host/port
export const API_BASE_URL = "https://burhanadminpanel.vercel.app";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export default api;
