/**
 * Modul API utama untuk komunikasi frontend (React) dengan backend (Laravel).
 * Berisi semua endpoint terkait autentikasi, pengambilan email, pengelolaan folder,
 * pengiriman email, draft, lampiran, dan operasi lainnya.
 */

import axios from "axios";

// Secure Token Manager
class TokenManager {
  static getToken() {
    const token = sessionStorage.getItem("authToken");
    const timestamp = parseInt(sessionStorage.getItem("tokenTimestamp"));

    // Token expires after 1 hour
    if (token && timestamp && Date.now() - timestamp > 3600000) {
      this.clearToken();
      return null;
    }

    return token;
  }

  static setToken(token) {
    sessionStorage.setItem("authToken", token);
    sessionStorage.setItem("tokenTimestamp", Date.now().toString());
  }

  static getRefreshToken() {
    return sessionStorage.getItem("refreshToken");
  }

  static setRefreshToken(refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }

  static getUser() {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  static setUser(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  }

  static clearToken() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("tokenTimestamp");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
  }
}

const API_BASE_URL = "http://127.0.0.1:8000/api";

// Membuat instance Axios dengan konfigurasi dasar (hapus Content-Type default untuk hindari konflik dengan FormData)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// Interceptor untuk menangani 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Tandai agar tidak loop tak terbatas
      try {
        const newToken = await refreshTokenApi();
        // Update header Authorization di original request
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        // Retry request dengan token baru
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Jika refresh gagal, hapus token dan lempar error
        TokenManager.clearToken();
        console.error("Refresh token failed:", refreshError); // Tambah logging untuk debug
        return Promise.reject(
          new Error("Session expired. Please login again.")
        );
      }
    }

    // Jika bukan 401 atau refresh gagal, lempar error asli
    return Promise.reject(error);
  }
);

/**
 * Mengambil header otentikasi standar untuk setiap permintaan API.
 * Termasuk token Bearer jika tersedia dari TokenManager.
 *
 * @returns {Object} Header standar dengan Authorization jika user login.
 */
const getAuthHeaders = () => {
  const token = TokenManager.getToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ==========================================================
// AUTHENTICATION (Sesuai AuthController + SecureJWTHandler)
// ==========================================================

/**
 * Login ke sistem.
 * Backend mengembalikan:
 * {
 *   user: { id, email, name },
 *   tokens: { access_token, refresh_token }
 * }
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient.post("/login", { email, password });
    const data = response.data;

    // Pastikan struktur sesuai backend
    if (!data.tokens?.access_token) {
      throw new Error("Token tidak ditemukan di respons");
    }

    // Simpan access token, refresh token, dan user info
    TokenManager.setToken(data.tokens.access_token);
    TokenManager.setRefreshToken(data.tokens.refresh_token);
    TokenManager.setUser(data.user);

    return {
      user: data.user,
      token: data.tokens.access_token,
    };
  } catch (err) {
    throw new Error(err.response?.data?.message || "Login gagal");
  }
};

/**
 * Refresh token untuk mendapatkan access token baru.
 * @returns {Promise<string>} Access token baru.
 */
export const refreshTokenApi = async () => {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  try {
    const response = await apiClient.post("/refresh", null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        Accept: "application/json",
      },
    });

    const data = response.data;
    TokenManager.setToken(data.tokens.access_token);
    TokenManager.setRefreshToken(data.tokens.refresh_token); // Update refresh token
    return data.tokens.access_token;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Refresh failed");
  }
};

/**
 * Logout dari sistem.
 * Backend akan blacklist token via SecureJWTHandler.
 */
export const logout = async () => {
  const token = TokenManager.getToken();

  // Hapus token lokal
  TokenManager.clearToken();

  if (!token) {
    return { message: "Already logged out" };
  }

  try {
    const response = await apiClient.post("/logout", null, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (err) {
    console.warn("Logout request failed, but token already cleared:", err);
    return { message: "Logged out locally" };
  }
};

// ==========================================================
// EMAIL MANAGEMENT
// ==========================================================

/**
 * Mengambil semua email dari server.
 * Dapat memaksa refresh cache jika diperlukan.
 *
 * @param {boolean} [forceRefresh=false] - Jika true, ambil data terbaru dari server.
 * @returns {Promise<Object>} Daftar email dari server.
 */
export const fetchEmailsApi = async (forceRefresh = false) => {
  const params = forceRefresh ? { refresh: "true" } : {};
  const response = await apiClient.get("/emails/all", {
    params,
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, // Tambah Content-Type jika perlu untuk GET
  });
  return response.data;
};

/**
 * Mengunduh lampiran email berdasarkan UID dan nama file.
 * File akan otomatis disimpan ke komputer pengguna.
 *
 * @param {string|number} uid - UID email.
 * @param {string} filename - Nama file lampiran.
 */
export const downloadAttachmentApi = async (uid, filename) => {
  const token = TokenManager.getToken();
  if (!token)
    throw new Error("Authentication token not found. Please login again.");

  const response = await apiClient.get(
    `/emails/attachments/${uid}/download/${filename}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    }
  );

  const blob = response.data;
  const url = window.URL.createObjectURL(blob);

  // Buat link unduhan manual agar browser otomatis mengunduh file
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Menampilkan preview lampiran email.
 * Jika ekstensi file tidak mendukung preview, fungsi akan mengembalikan fallback untuk download.
 */
export const previewAttachmentApi = async (uid, filename) => {
  const token = TokenManager.getToken();
  if (!token)
    throw new Error("Authentication token not found. Please login again.");

  const ext = filename.split(".").pop().toLowerCase();
  const previewable = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "txt", "md", "mov", "mp4"];

  // Jika tidak bisa di-preview → kembalikan flag fallback
  if (!previewable.includes(ext)) {
    return { fallbackDownload: true };
  }

  const response = await apiClient.get(
    `/emails/attachments/${uid}/preview/${encodeURIComponent(filename)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    }
  );

  const blob = response.data;
  const url = URL.createObjectURL(blob);

  return { url, mimeType: blob.type, filename, fallbackDownload: false };
};

// ==========================================================
// EMAIL STATUS HANDLERS
// ==========================================================

/**
 * Menandai email sebagai "sudah dibaca".
 */
export const markAsReadApi = async (folder, messageId) => {
  const response = await apiClient.post(
    "/emails/mark-as-read",
    { folder, message_id: messageId },
    {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menandai email sebagai "belum dibaca".
 */
export const markAsUnreadApi = async (folder, messageId) => {
  const response = await apiClient.post(
    "/emails/mark-as-unread",
    { folder, message_id: messageId },
    {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menandai email sebagai "flagged" (bintang).
 */
export const markAsFlaggedApi = async (folder, messageId) => {
  const response = await apiClient.post(
    "/emails/flag",
    { folder, message_id: messageId },
    {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menghapus tanda "flagged" dari email.
 */
export const markAsUnflaggedApi = async (folder, messageId) => {
  const response = await apiClient.post(
    "/emails/unflag",
    { folder, message_id: messageId },
    {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    }
  );
  return response.data;
};

// ==========================================================
// EMAIL FOLDER & DELETION
// ==========================================================

/**
 * Memindahkan email ke folder lain (Inbox, Archive, Junk, dll).
 */
export const moveEmailApi = async (folder, messageIds, targetFolder) => {
  const response = await apiClient.post(
    "/emails/move",
    {
      folder,
      message_ids: messageIds,
      target_folder: targetFolder,
    },
    {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menghapus seluruh email dari folder Trash secara permanen.
 */
export const deletePermanentAllApi = async () => {
  const response = await apiClient.delete("/emails/delete-permanent-all", {
    headers: getAuthHeaders(),
  });
  return response.data;
};

/**
 * Menghapus email tertentu secara permanen dari Trash.
 */
export const deletePermanentApi = async (messageIds) => {
  const response = await apiClient.delete("/emails/deletePermanent", {
    headers: getAuthHeaders(),
    data: { messageIds },
  });
  return response.data;
};

// ==========================================================
// SEND, DRAFTS & ATTACHMENTS
// ==========================================================

/**
 * Mengirim email baru atau lanjutan (reply/forward/draft).
 * Mendukung lampiran dan file yang sudah tersimpan.
 *
 * @param {Object} payload - Data email yang dikirim.
 * @param {string} payload.to - Tujuan penerima email.
 * @param {string} payload.subject - Subjek email.
 * @param {string} payload.body - Isi pesan email.
 * @param {File[]} [payload.attachments] - Lampiran baru.
 * @param {string[]} [payload.storedAttachments] - Lampiran lama dari draft.
 * @param {string} [payload.draftId] - ID draft (jika update draft).
 * @param {string} [payload.messageId] - ID pesan untuk reply/forward.
 * @returns {Promise<Object>} Respons dari API setelah pengiriman.
 */
export const sendEmailApi = async ({
  to,
  subject,
  body,
  attachments,
  draftId,
  storedAttachments,
  messageId,
}) => {
  try {
  const token = TokenManager.getToken();
  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }

  const formData = new FormData();
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("body", body);

  if (draftId) {
    formData.append("draft_id", draftId);
  }

  if (messageId) {
    formData.append("message_id", messageId);
  }

  if (storedAttachments && storedAttachments.length > 0) {
    formData.append("stored_attachments", JSON.stringify(storedAttachments));
  }

  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append("attachments[]", file);
    });
  }

  const response = await apiClient.post("/emails/send", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "multipart/form-data", // Tambah ini untuk fix attachment
    },
  });

  return response.data; 
  // new changed
} catch (error) {  
    // TAMBAHKAN ERROR HANDLING INI
    console.error("sendEmailApi full error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Extract error message dengan priority yang benar
    const errorMessage = 
      error.response?.data?.error ||        // Priority 1: error field dari backend
      error.response?.data?.message ||      // Priority 2: message field
      error.message ||                       // Priority 3: axios error message
      "Gagal mengirim email";               // Fallback

    throw new Error(errorMessage);
  }
};

/**
 * Menyimpan email sebagai draft.
 * Mendukung lampiran baru yang dikirim melalui FormData.
 */
export const saveDraftApi = async ({ to, subject, body, attachments }) => {
  try {
  const token = TokenManager.getToken();
  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }

  const formData = new FormData();
  if (to) formData.append("to", to);
  if (subject) formData.append("subject", subject);
  if (body) formData.append("body", body);

  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append("attachments[]", file);
    });
  }

  const response = await apiClient.post("/emails/draft", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "multipart/form-data", // Tambah ini untuk fix attachment
    },
  });

  return response.data;
  // new changed
} catch (error) {
    // TAMBAHKAN ERROR HANDLING INI
    console.error("saveDraftApi full error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Extract error message dengan priority yang benar
    const errorMessage = 
      error.response?.data?.error ||        // Priority 1: error field dari backend
      error.response?.data?.message ||      // Priority 2: message field
      error.message ||                       // Priority 3: axios error message
      "Gagal menyimpan draft";              // Fallback

    throw new Error(errorMessage);
  }
};
