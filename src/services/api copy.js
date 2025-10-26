/**
 * Modul API utama untuk komunikasi frontend (React) dengan backend (Laravel).
 * Berisi semua endpoint terkait autentikasi, pengambilan email, pengelolaan folder,
 * pengiriman email, draft, lampiran, dan operasi lainnya.
 */

const API_BASE_URL = "http://127.0.0.1:8000/api";

// TokenManager class for secure token storage
class TokenManager {
  static getToken() {
    const token = sessionStorage.getItem("authToken");
    const timestamp = parseInt(sessionStorage.getItem("tokenTimestamp"));

    // Token expires after 1 hour
    if (timestamp && Date.now() - timestamp > 3600000) {
      this.clearToken();
      return null;
    }

    return token;
  }

  static setToken(token) {
    sessionStorage.setItem("authToken", token);
    sessionStorage.setItem("tokenTimestamp", Date.now().toString());
  }

  static clearToken() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("tokenTimestamp");
    sessionStorage.removeItem("refreshToken"); // Also clear refresh token
    sessionStorage.removeItem("user"); // Also clear user info
  }

  // Method to refresh token using refresh_token
  static async refreshToken() {
    const refreshToken = sessionStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${refreshToken}`, // Send refresh token as Bearer token
      },
    });

    const data = await response.json();
    if (!response.ok) {
      this.clearToken();
      throw new Error(data.message || "Failed to refresh token");
    }

    // Save new access token and timestamp
    this.setToken(data.tokens.access_token);

    // Update refresh token (backend always returns a new one due to rotation)
    if (data.tokens.refresh_token) {
      sessionStorage.setItem("refreshToken", data.tokens.refresh_token);
    }

    return data.tokens.access_token;
  }
}

/**
 * Mengambil header otentikasi standar untuk setiap permintaan API.
 * Termasuk token Bearer jika tersedia dari TokenManager.
 *
 * @returns {Object} Header standar dengan Authorization jika user login.
 */
const getAuthHeaders = () => {
  const token = TokenManager.getToken();
  return {
    "Content-Type": "application/json",
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
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    throw new Error(data.message || "Login gagal");
  }

  // Pastikan struktur sesuai backend
  if (!data.tokens?.access_token) {
    throw new Error("Token tidak ditemukan di respons");
  }

  // Simpan access token using TokenManager
  TokenManager.setToken(data.tokens.access_token);

  // Simpan refresh token jika ada
  if (data.tokens.refresh_token) {
    sessionStorage.setItem("refreshToken", data.tokens.refresh_token);
  }

  // Simpan user info
  sessionStorage.setItem("user", JSON.stringify(data.user));

  return {
    user: data.user,
    token: data.tokens.access_token,
  };
};

/**
 * Logout dari sistem.
 * Backend akan blacklist token via SecureJWTHandler.
 */
export const logout = async () => {
  const token = TokenManager.getToken();

  // Clear tokens first
  TokenManager.clearToken();

  if (!token) {
    return { message: "Already logged out" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn(
        "Logout API failed, but token already removed locally:",
        data
      );
    }

    return data;
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
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const url = new URL(`${API_BASE_URL}/emails/all`);
  if (forceRefresh) url.searchParams.append("refresh", "true");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (res.status === 401) {
    TokenManager.clearToken();
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch emails");
  }

  return await res.json();
};

/**
 * Mengunduh lampiran email berdasarkan UID dan nama file.
 * File akan otomatis disimpan ke komputer pengguna.
 *
 * @param {string|number} uid - UID email.
 * @param {string} filename - Nama file lampiran.
 */
export const downloadAttachmentApi = async (uid, filename) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const res = await fetch(
    `${API_BASE_URL}/emails/attachments/${uid}/download/${filename}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Download failed:", res.status, errorText);
    throw new Error("Failed to download attachment");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

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
 */
export const markAsReadApi = async (folder, messageId) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const response = await fetch(`${API_BASE_URL}/emails/mark-as-read`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ folder, message_id: messageId }),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to mark email as read");
  return data;
};

/**
 * Menandai email sebagai "belum dibaca".
 */
export const markAsUnreadApi = async (folder, messageId) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const response = await fetch(`${API_BASE_URL}/emails/mark-as-unread`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ folder, message_id: messageId }),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to mark email as unread");
  return data;
};

/**
 * Menandai email sebagai "flagged" (bintang).
 */
export const markAsFlaggedApi = async (folder, messageId) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const response = await fetch(`${API_BASE_URL}/emails/flag`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ folder, message_id: messageId }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to flag email");
  return data;
};

/**
 * Menghapus tanda "flagged" dari email.
 */
export const markAsUnflaggedApi = async (folder, messageId) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const response = await fetch(`${API_BASE_URL}/emails/unflag`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ folder, message_id: messageId }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to unflag email");
  return data;
};

// ==========================================================
// EMAIL FOLDER & DELETION
// ==========================================================

/**
 * Memindahkan email ke folder lain (Inbox, Archive, Junk, dll).
 */
export const moveEmailApi = async (folder, messageIds, targetFolder) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const response = await fetch(`${API_BASE_URL}/emails/move`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      folder,
      message_ids: messageIds,
      target_folder: targetFolder,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to move email(s)");
  return data;
};

/**
 * Menghapus seluruh email dari folder Trash secara permanen.
 */
export const deletePermanentAllApi = async () => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const response = await fetch(`${API_BASE_URL}/emails/delete-permanent-all`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to permanently delete all emails");
  return data;
};

/**
 * Menghapus email tertentu secara permanen dari Trash.
 */
export const deletePermanentApi = async (messageIds) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const response = await fetch(`${API_BASE_URL}/emails/deletePermanent`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ messageIds }),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to permanently delete emails");
  return data;
};

// ==========================================================
// SEND, DRAFTS & ATTACHMENTS
// ==========================================================

/**
 * Mengirim email baru atau lanjutan (reply/forward/draft).
 * Mendukung lampiran dan file yang sudah tersimpan.
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
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
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

  const response = await fetch(`${API_BASE_URL}/emails/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send email");
  }

  return data;
};

/**
 * Menyimpan email sebagai draft.
 * Mendukung lampiran baru yang dikirim melalui FormData.
 */
export const saveDraftApi = async ({ to, subject, body, attachments }) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
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

  const response = await fetch(`${API_BASE_URL}/emails/draft`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to save draft");
  }

  return data;
};

/**
 * Menampilkan preview lampiran email.
 * Jika ekstensi file tidak mendukung preview, fungsi akan mengembalikan fallback untuk download.
 */
export const previewAttachmentApi = async (uid, filename) => {
  let token = TokenManager.getToken();
  if (!token) {
    try {
      token = await TokenManager.refreshToken();
    } catch (err) {
      throw new Error("Authentication token not found. Please login again.");
    }
  }

  const ext = filename.split(".").pop().toLowerCase();
  const previewable = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "txt"];

  if (!previewable.includes(ext)) {
    return { fallbackDownload: true };
  }

  const res = await fetch(
    `${API_BASE_URL}/emails/attachments/${uid}/preview/${encodeURIComponent(
      filename
    )}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) throw new Error("Failed to preview attachment");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  return { url, mimeType: blob.type, filename, fallbackDownload: false };
};
