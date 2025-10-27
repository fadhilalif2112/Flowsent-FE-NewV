/**
 * Modul API utama untuk komunikasi frontend (React) dengan backend (Laravel).
 * Berisi semua endpoint terkait autentikasi, pengambilan email, pengelolaan folder,
 * pengiriman email, draft, lampiran, dan operasi lainnya.
 */

import axios from "axios";

// Secure Token Manager
class TokenManager {
  /**
   * Retrieves the authentication token from session storage.
   * Checks if the token has expired (after 1 hour) and clears it if necessary.
   *
   * @returns {string|null} The token if valid, otherwise null.
   */
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

  /**
   * Sets the authentication token in session storage along with the current timestamp.
   *
   * @param {string} token - The authentication token to store.
   */
  static setToken(token) {
    sessionStorage.setItem("authToken", token);
    sessionStorage.setItem("tokenTimestamp", Date.now().toString());
  }

  /**
   * Retrieves the refresh token from session storage.
   *
   * @returns {string|null} The refresh token if available, otherwise null.
   */
  static getRefreshToken() {
    return sessionStorage.getItem("refreshToken");
  }

  /**
   * Sets the refresh token in session storage.
   *
   * @param {string} refreshToken - The refresh token to store.
   */
  static setRefreshToken(refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }

  /**
   * Retrieves the user data from session storage.
   *
   * @returns {Object|null} The parsed user object if available, otherwise null.
   */
  static getUser() {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  /**
   * Sets the user data in session storage.
   *
   * @param {Object} user - The user object to store.
   */
  static setUser(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  }

  /**
   * Clears all authentication-related items from session storage.
   */
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

    // Skip retry jika ini request refresh itu sendiri untuk hindari loop
    if (originalRequest.url === "/refresh") {
      TokenManager.clearToken();
      return Promise.reject(
        new Error("Refresh token invalid. Please login again.")
      );
    }

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
 * Jika token tidak valid, akan mencoba refresh terlebih dahulu.
 *
 * @returns {Promise<Object>} Header standar dengan Authorization jika user login.
 */
const getAuthHeaders = async () => {
  let token = TokenManager.getToken();
  if (!token) {
    // Jika token hilang atau expired, coba refresh dulu
    try {
      token = await refreshTokenApi();
    } catch (err) {
      throw new Error("Unable to refresh token. Please login again.");
    }
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
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
 *
 * @param {string} email - Email pengguna untuk login.
 * @param {string} password - Password pengguna untuk login.
 * @returns {Promise<Object>} Objek berisi user dan token jika login berhasil.
 * @throws {Error} Jika login gagal atau respons tidak sesuai.
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
 *
 * @returns {Promise<string>} Access token baru jika refresh berhasil.
 * @throws {Error} Jika refresh gagal atau tidak ada refresh token.
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
    if (err.response?.data?.message === "refresh_token_expired") {
      TokenManager.clearToken();
      // Redirect ke login atau trigger event logout
      window.location.href = "/login"; // Contoh redirect, sesuaikan dengan routing React Anda
    }
    throw new Error(err.response?.data?.message || "Refresh failed");
  }
};

/**
 * Logout dari sistem.
 * Backend akan blacklist token via SecureJWTHandler.
 *
 * @returns {Promise<Object>} Respons logout dari backend atau pesan lokal jika gagal.
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
 * @throws {Error} Jika request gagal.
 */
export const fetchEmailsApi = async (forceRefresh = false) => {
  const params = forceRefresh ? { refresh: "true" } : {};
  const headers = await getAuthHeaders();
  const response = await apiClient.get("/emails/all", {
    params,
    headers: { ...headers, "Content-Type": "application/json" }, // Tambah Content-Type jika perlu untuk GET
  });
  return response.data;
};

/**
 * Mengunduh lampiran email berdasarkan UID dan nama file.
 * File akan otomatis disimpan ke komputer pengguna.
 *
 * @param {string|number} uid - UID email.
 * @param {string} filename - Nama file lampiran.
 * @throws {Error} Jika token tidak ditemukan atau request gagal.
 */
export const downloadAttachmentApi = async (uid, filename) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.get(
    `/emails/attachments/${uid}/download/${filename}`,
    {
      headers,
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

// ==========================================================
// EMAIL STATUS HANDLERS
// ==========================================================

/**
 * Menandai email sebagai "sudah dibaca".
 *
 * @param {string} folder - Folder email (e.g., Inbox).
 * @param {string|number} messageId - ID pesan email.
 * @returns {Promise<Object>} Respons dari API setelah penandaan.
 * @throws {Error} Jika request gagal.
 */
export const markAsReadApi = async (folder, messageId) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.post(
    "/emails/mark-as-read",
    { folder, message_id: messageId },
    {
      headers: { ...headers, "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menandai email sebagai "belum dibaca".
 *
 * @param {string} folder - Folder email (e.g., Inbox).
 * @param {string|number} messageId - ID pesan email.
 * @returns {Promise<Object>} Respons dari API setelah penandaan.
 * @throws {Error} Jika request gagal.
 */
export const markAsUnreadApi = async (folder, messageId) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.post(
    "/emails/mark-as-unread",
    { folder, message_id: messageId },
    {
      headers: { ...headers, "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menandai email sebagai "flagged" (bintang).
 *
 * @param {string} folder - Folder email (e.g., Inbox).
 * @param {string|number} messageId - ID pesan email.
 * @returns {Promise<Object>} Respons dari API setelah penandaan.
 * @throws {Error} Jika request gagal.
 */
export const markAsFlaggedApi = async (folder, messageId) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.post(
    "/emails/flag",
    { folder, message_id: messageId },
    {
      headers: { ...headers, "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menghapus tanda "flagged" dari email.
 *
 * @param {string} folder - Folder email (e.g., Inbox).
 * @param {string|number} messageId - ID pesan email.
 * @returns {Promise<Object>} Respons dari API setelah penandaan.
 * @throws {Error} Jika request gagal.
 */
export const markAsUnflaggedApi = async (folder, messageId) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.post(
    "/emails/unflag",
    { folder, message_id: messageId },
    {
      headers: { ...headers, "Content-Type": "application/json" },
    }
  );
  return response.data;
};

// ==========================================================
// EMAIL FOLDER & DELETION
// ==========================================================

/**
 * Memindahkan email ke folder lain (Inbox, Archive, Junk, dll).
 *
 * @param {string} folder - Folder asal email.
 * @param {Array<string|number>} messageIds - Array ID pesan email yang akan dipindah.
 * @param {string} targetFolder - Folder tujuan.
 * @returns {Promise<Object>} Respons dari API setelah pemindahan.
 * @throws {Error} Jika request gagal.
 */
export const moveEmailApi = async (folder, messageIds, targetFolder) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.post(
    "/emails/move",
    {
      folder,
      message_ids: messageIds,
      target_folder: targetFolder,
    },
    {
      headers: { ...headers, "Content-Type": "application/json" },
    }
  );
  return response.data;
};

/**
 * Menghapus seluruh email dari folder Trash secara permanen.
 *
 * @returns {Promise<Object>} Respons dari API setelah penghapusan.
 * @throws {Error} Jika request gagal.
 */
export const deletePermanentAllApi = async () => {
  const headers = await getAuthHeaders();
  const response = await apiClient.delete("/emails/delete-permanent-all", {
    headers,
  });
  return response.data;
};

/**
 * Menghapus email tertentu secara permanen dari Trash.
 *
 * @param {Array<string|number>} messageIds - Array ID pesan email yang akan dihapus permanen.
 * @returns {Promise<Object>} Respons dari API setelah penghapusan.
 * @throws {Error} Jika request gagal.
 */
export const deletePermanentApi = async (messageIds) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.delete("/emails/deletePermanent", {
    headers,
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
 * @throws {Error} Jika token tidak ditemukan atau request gagal.
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
    const headers = await getAuthHeaders();

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
        ...headers,
        "Content-Type": "multipart/form-data", // Tambah ini untuk fix attachment
      },
    });

    return response.data;
  } catch (err) {
    console.error("Send email failed:", err.message);
    if (err.message.includes("Session expired")) {
      alert("Session expired. Please login again.");
      TokenManager.clearToken();
      window.location.href = "/login"; // Sesuaikan dengan routing React Anda
    }
    throw err;
  }
};

/**
 * Menyimpan email sebagai draft.
 * Mendukung lampiran baru yang dikirim melalui FormData.
 *
 * @param {Object} payload - Data draft email.
 * @param {string} [payload.to] - Tujuan penerima email.
 * @param {string} [payload.subject] - Subjek email.
 * @param {string} [payload.body] - Isi pesan email.
 * @param {File[]} [payload.attachments] - Lampiran baru.
 * @returns {Promise<Object>} Respons dari API setelah penyimpanan draft.
 * @throws {Error} Jika token tidak ditemukan atau request gagal.
 */
export const saveDraftApi = async ({ to, subject, body, attachments }) => {
  try {
    const headers = await getAuthHeaders();

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
        ...headers,
        "Content-Type": "multipart/form-data", // Tambah ini untuk fix attachment
      },
    });

    return response.data;
  } catch (err) {
    console.error("Save draft failed:", err.message);
    if (err.message.includes("Session expired")) {
      alert("Session expired. Please login again.");
      TokenManager.clearToken();
      window.location.href = "/login"; // Sesuaikan dengan routing React Anda
    }
    throw err;
  }
};

/**
 * Menampilkan preview lampiran email.
 * Jika ekstensi file tidak mendukung preview, fungsi akan mengembalikan fallback untuk download.
 *
 * @param {string|number} uid - UID email.
 * @param {string} filename - Nama file lampiran.
 * @returns {Promise<Object>} Objek berisi URL preview, MIME type, filename, atau flag fallbackDownload.
 * @throws {Error} Jika token tidak ditemukan atau request gagal.
 */
export const previewAttachmentApi = async (uid, filename) => {
  const headers = await getAuthHeaders();

  const ext = filename.split(".").pop().toLowerCase();
  const previewable = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "txt"];

  // Jika tidak bisa di-preview → kembalikan flag fallback
  if (!previewable.includes(ext)) {
    return { fallbackDownload: true };
  }

  const response = await apiClient.get(
    `/emails/attachments/${uid}/preview/${encodeURIComponent(filename)}`,
    {
      headers,
      responseType: "blob",
    }
  );

  const blob = response.data;
  const url = URL.createObjectURL(blob);

  return { url, mimeType: blob.type, filename, fallbackDownload: false };
};
