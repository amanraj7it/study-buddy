const API_BASE_URL = "http://127.0.0.1:5000/api";

const TOKEN_KEY = "studybuddy_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Candidate URLs to try in order (127.0.0.1 -> localhost -> Vite dev proxy /api)
  const candidateUrls = path.startsWith("http")
    ? [path]
    : [
        `http://127.0.0.1:5000/api${cleanPath}`,
        `http://localhost:5000/api${cleanPath}`,
        `/api${cleanPath}`,
      ];

  let lastError = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        clearToken();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { success: response.ok, message: text };
        }
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      lastError = err;
      if (err.name === "TypeError" && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
        // Try next candidate URL (e.g. 127.0.0.1 vs localhost vs proxy)
        continue;
      }
      throw err;
    }
  }

  if (lastError && lastError.name === "TypeError" && lastError.message.includes("Failed to fetch")) {
    const connectionError = new Error("Cannot connect to StudyBuddy backend on port 5000. Please ensure 'python app.py' is running.");
    connectionError.isConnectionRefused = true;
    throw connectionError;
  }
  throw lastError;
}

export const api = {
  // Auth
  auth: {
    sendOtp: (userData) => apiFetch("/auth/send-otp", { method: "POST", body: userData }),
    verifyOtp: (otpData) => apiFetch("/auth/verify-otp", { method: "POST", body: otpData }),
    resendOtp: (emailData) => apiFetch("/auth/resend-otp", { method: "POST", body: emailData }),
    forgotPassword: (emailData) => apiFetch("/auth/forgot-password", { method: "POST", body: emailData }),
    resetPassword: (resetData) => apiFetch("/auth/reset-password", { method: "POST", body: resetData }),
    register: (userData) => apiFetch("/auth/register", { method: "POST", body: userData }),
    login: (credentials) => apiFetch("/auth/login", { method: "POST", body: credentials }),
    me: () => apiFetch("/auth/me"),
  },

  // AI Study Copilot
  ai: {
    studyAssistant: (data) => apiFetch("/ai/study-assistant", { method: "POST", body: data }),
  },

  // Pomodoro Focus
  pomodoro: {
    logSession: (data) => apiFetch("/pomodoro/log-session", { method: "POST", body: data }),
  },

  // Subjects
  subjects: {
    getAll: () => apiFetch("/subjects"),
    getById: (id) => apiFetch(`/subjects/${id}`),
    create: (data) => apiFetch("/subjects", { method: "POST", body: data }),
    update: (id, data) => apiFetch(`/subjects/${id}`, { method: "PUT", body: data }),
    delete: (id) => apiFetch(`/subjects/${id}`, { method: "DELETE" }),
  },

  // Tasks
  tasks: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append("status", params.status);
      if (params.priority) query.append("priority", params.priority);
      if (params.subject_id) query.append("subject_id", params.subject_id);
      if (params.search) query.append("search", params.search);
      const qs = query.toString();
      return apiFetch(`/tasks${qs ? `?${qs}` : ""}`);
    },
    getById: (id) => apiFetch(`/tasks/${id}`),
    create: (data) => apiFetch("/tasks", { method: "POST", body: data }),
    update: (id, data) => apiFetch(`/tasks/${id}`, { method: "PUT", body: data }),
    toggle: (id) => apiFetch(`/tasks/${id}/toggle`, { method: "PATCH" }),
    delete: (id) => apiFetch(`/tasks/${id}`, { method: "DELETE" }),
  },

  // Notes
  notes: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.subject_id) query.append("subject_id", params.subject_id);
      if (params.search) query.append("search", params.search);
      const qs = query.toString();
      return apiFetch(`/notes${qs ? `?${qs}` : ""}`);
    },
    getById: (id) => apiFetch(`/notes/${id}`),
    create: (data) => apiFetch("/notes", { method: "POST", body: data }),
    update: (id, data) => apiFetch(`/notes/${id}`, { method: "PUT", body: data }),
    delete: (id) => apiFetch(`/notes/${id}`, { method: "DELETE" }),
  },

  // Schedule
  schedule: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.start_date) query.append("start_date", params.start_date);
      if (params.end_date) query.append("end_date", params.end_date);
      const qs = query.toString();
      return apiFetch(`/schedule${qs ? `?${qs}` : ""}`);
    },
    create: (data) => apiFetch("/schedule", { method: "POST", body: data }),
    update: (id, data) => apiFetch(`/schedule/${id}`, { method: "PUT", body: data }),
    delete: (id) => apiFetch(`/schedule/${id}`, { method: "DELETE" }),
  },

  // Goals
  goals: {
    getAll: () => apiFetch("/goals"),
    create: (data) => apiFetch("/goals", { method: "POST", body: data }),
    update: (id, data) => apiFetch(`/goals/${id}`, { method: "PUT", body: data }),
    delete: (id) => apiFetch(`/goals/${id}`, { method: "DELETE" }),
  },

  // Dashboard
  dashboard: {
    get: () => apiFetch("/dashboard"),
  },

  // Dev Seed
  seed: () => apiFetch("/seed", { method: "POST" }),
};

export default api;
