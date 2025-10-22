// src/contexts/EmailContext.jsx
import React, { createContext, useContext, useState } from "react";
import {
  fetchEmailsApi,
  markAsReadApi,
  markAsFlaggedApi,
  markAsUnflaggedApi,
  moveEmailApi,
  deletePermanentApi,
} from "../services/api";
import Loading from "../components/common/Loading";
import Notification from "../components/common/Notification";

const EmailContext = createContext();
export const useEmail = () => useContext(EmailContext);

export function EmailProvider({ children }) {
  // === STATE ===
  const [allEmails, setAllEmails] = useState([]); // Store all emails from /emails/all
  const [emails, setEmails] = useState([]); // Filtered and paginated emails for current folder
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading emails...");
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const [notification, setNotification] = useState(null);

  // === UTILS: PAGINATE EMAILS (Client-side) ===
  const paginateEmails = (folderEmails, page, perPage) => {
    const total = folderEmails.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    const data = folderEmails.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        current_page: page,
        per_page: perPage,
        total,
        total_pages: totalPages,
        from: total > 0 ? startIndex + 1 : 0,
        to: Math.min(endIndex, total),
      },
    };
  };

  // === FUNCTION: FETCH EMAILS ===
  const fetchEmail = async (
    folder = "inbox",
    page = currentPage,
    limit = perPage,
    forceRefresh = false
  ) => {
    setLoading(true);
    try {
      // Fetch all emails if not loaded or force refresh
      if (!allEmails.length || forceRefresh) {
        const response = await fetchEmailsApi(forceRefresh);
        console.log("Fetch emails response:", response); // Debug

        if (response.status === "success") {
          // Konversi object { inbox: [], sent: [], ... } menjadi array dengan folder
          const emailsWithFolder = Object.entries(response.data).flatMap(
            ([folderName, emails]) => {
              return emails.map((email) => ({
                ...email,
                folder: folderName, // Tambahkan properti folder
              }));
            }
          );
          setAllEmails(emailsWithFolder);
        } else {
          throw new Error(
            response.error || response.message || "Failed to fetch emails"
          );
        }
      }

      // Filter by folder (case-insensitive)
      const folderEmails = allEmails.filter(
        (email) => email.folder?.toLowerCase() === folder.toLowerCase()
      );

      // Paginate filtered emails
      const paginated = paginateEmails(folderEmails, page, limit);
      setEmails(paginated.data);
      setPagination(paginated.pagination);
    } catch (err) {
      console.error("Error fetching emails:", err);
      showNotification(err.message || "Gagal memuat email", "error");
    } finally {
      setLoading(false);
    }
  };

  // === FUNCTION: REFRESH EMAIL ===
  const refreshEmail = async (folder) => {
    try {
      await fetchEmail(folder, currentPage, perPage, true);
      setLoadingMessage("Loading emails...");
    } catch (err) {
      console.error("Error refreshing emails:", err);
    } finally {
      setLoading(false);
    }
  };

  // === UTILS: SHOW NOTIFICATION ===
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
  };

  // === HANDLERS (Now using real API) ===
  const markAsRead = async (emailIds, currentFolder) => {
    setLoading(true);
    setLoadingMessage("Marking as read...");
    try {
      // Backend expects single message_id per call, but we can loop for multiple
      for (const id of emailIds) {
        await markAsReadApi(currentFolder, id);
      }
      showNotification(`Marked ${emailIds.length} email(s) as read`, "success");
      await refreshEmail(currentFolder);
    } catch (err) {
      console.error("Error marking as read:", err);
      showNotification("Gagal menandai sebagai sudah dibaca", "error");
    } finally {
      setLoading(false);
    }
  };

  // Note: Backend doesn't have markAsUnread endpoint. If needed, add to backend or skip.
  // For now, commenting out or leaving as dummy if required.
  const markAsUnread = async (emailIds) => {
    // Implement if backend adds it, or use dummy for now
    setLoading(true);
    setLoadingMessage("Marking as unread...");
    try {
      await new Promise((res) => setTimeout(res, 1000)); // Dummy delay
      showNotification(
        `Marked ${emailIds.length} email(s) as unread`,
        "success"
      );
      await refreshEmail("inbox");
    } catch (err) {
      console.error("Error marking as unread:", err);
      showNotification("Gagal menandai sebagai belum dibaca", "error");
    } finally {
      setLoading(false);
    }
  };

  const flagEmail = async (emailIds, currentFolder) => {
    setLoading(true);
    setLoadingMessage("Flagging email...");
    try {
      for (const id of emailIds) {
        await markAsFlaggedApi(currentFolder, id);
      }
      showNotification(`Flagged ${emailIds.length} email(s)`, "success");
      await refreshEmail(currentFolder);
    } catch (err) {
      console.error("Error flagging email:", err);
      showNotification("Gagal menandai bendera", "error");
    } finally {
      setLoading(false);
    }
  };

  const unflagEmail = async (emailIds, currentFolder) => {
    setLoading(true);
    setLoadingMessage("Unflagging email...");
    try {
      for (const id of emailIds) {
        await markAsUnflaggedApi(currentFolder, id);
      }
      showNotification(`Unflagged ${emailIds.length} email(s)`, "success");
      await refreshEmail(currentFolder);
    } catch (err) {
      console.error("Error unflagging email:", err);
      showNotification("Gagal menghapus bendera", "error");
    } finally {
      setLoading(false);
    }
  };

  const moveEmail = async (emailIds, targetFolder, currentFolder) => {
    setLoading(true);
    setLoadingMessage(`Moving email(s) to ${targetFolder}...`);
    try {
      const response = await moveEmailApi(
        currentFolder,
        emailIds,
        targetFolder
      );

      if (response.status === "success") {
        showNotification(
          `Moved ${emailIds.length} email(s) to ${targetFolder}`,
          "success"
        );
        await refreshEmail(currentFolder);
      } else {
        throw new Error(response.message || response.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error moving email:", err);
      let errorMsg = "Gagal memindahkan email";
      if (err.message.includes("401"))
        errorMsg += " – Sesi habis, silakan login ulang";
      if (err.message.includes("404"))
        errorMsg += " – Endpoint tidak ditemukan";
      if (err.message.includes("500")) errorMsg += " – Server error";
      showNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteEmails = async (emailIds) => {
    setLoading(true);
    setLoadingMessage("Deleting email...");
    try {
      const response = await deletePermanentApi(emailIds);
      if (response.success) {
        showNotification(`Deleted ${emailIds.length} email(s)`, "success");
        await refreshEmail("inbox"); // Adjust folder if needed
      } else {
        throw new Error(response.message || "Failed to delete emails");
      }
    } catch (err) {
      console.error(err);
      showNotification("Gagal menghapus email", "error");
    } finally {
      setLoading(false);
    }
  };

  // === PROVIDER VALUE ===
  const value = {
    emails,
    loading,
    pagination,
    currentPage,
    perPage,
    selectedEmailIds,
    allEmails,

    fetchEmail,
    refreshEmail,
    markAsRead, // Renamed for clarity
    markAsUnread,
    flagEmail,
    unflagEmail,
    moveEmail,
    deleteEmails,

    setCurrentPage,
    setPerPage,
    setSelectedEmailIds,
  };

  return (
    <EmailContext.Provider value={value}>
      {/* Render children */}
      {children}

      {/* Global Loading Overlay */}
      {loading && <Loading message={loadingMessage} />}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </EmailContext.Provider>
  );
}
