// src/contexts/EmailContext.jsx
import React, { createContext, useContext, useState } from "react";
import {
  fetchEmailsApi,
  markAsReadApi,
  markAsUnreadApi,
  markAsFlaggedApi,
  markAsUnflaggedApi,
  moveEmailApi,
  deletePermanentApi,
} from "../services/api";
import Notification from "../components/common/Notification";

const EmailContext = createContext();
export const useEmail = () => useContext(EmailContext);

export function EmailProvider({ children }) {
  // === STATE ===
  const [allEmails, setAllEmails] = useState([]); // Semua email (dari semua folder)
  const [emails, setEmails] = useState([]); // Email aktif (folder yang sedang dibuka)
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const [notification, setNotification] = useState(null);
  // [CHANGE] Added global loading state for any action
  const [isAnyActionLoading, setActionLoading] = useState(false);

  // === UTILS: PAGINASI CLIENT-SIDE ===
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
    try {
      if (!allEmails.length || forceRefresh) {
        const response = await fetchEmailsApi(forceRefresh);
        console.log("Fetch emails response:", response);

        if (response.status === "fail" || response.status === "error") {
          throw new Error(
            response.error || response.message || "Failed to fetch emails"
          );
        }

        if (response.status === "success" && response.data) {
          // ubah bentuk object { inbox: [], sent: [] } → array tunggal
          const emailsWithFolder = Object.entries(response.data).flatMap(
            ([folderName, emails]) =>
              emails.map((email) => ({
                ...email,
                folder: folderName,
              }))
          );

          setAllEmails(emailsWithFolder);
          console.log("All emails:", emailsWithFolder);
        } else {
          throw new Error("Invalid response format");
        }
      }

      let folderEmails = [];

      // === Tambahkan kembali aturan untuk folder "starred" ===
      if (folder.toLowerCase() === "starred") {
        folderEmails = allEmails.filter((email) => email.flagged === true);
      } else {
        folderEmails = allEmails.filter(
          (email) => email.folder?.toLowerCase() === folder.toLowerCase()
        );
      }

      const paginated = paginateEmails(folderEmails, page, limit);
      setEmails(paginated.data);
      setPagination(paginated.pagination);
    } catch (err) {
      console.error("Error fetching emails:", err);
      showNotification(err.message || "Gagal memuat email", "error");
    }
  };

  // === FUNCTION: REFRESH EMAIL ===
  const refreshEmail = async (folder) => {
    try {
      await fetchEmail(folder, currentPage, perPage, true);
    } catch (err) {
      console.error("Error refreshing emails:", err);
    }
  };

  // === UTILS: SHOW NOTIFICATION ===
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
  };

  // === HANDLERS ===
  const markAsRead = async (emailIds, currentFolder) => {
    setActionLoading(true); // [CHANGE] Set global loading
    try {
      for (const id of emailIds) {
        await markAsReadApi(currentFolder, id);
      }
      showNotification(`Marked ${emailIds.length} email(s) as read`, "success");
      await refreshEmail(currentFolder);
    } catch (err) {
      console.error("Error marking as read:", err);
      showNotification("Gagal menandai sebagai sudah dibaca", "error");
    } finally {
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  const markAsUnread = async (emailIds, currentFolder) => {
    setActionLoading(true); // [CHANGE] Set global loading
    try {
      for (const id of emailIds) {
        await markAsUnreadApi(currentFolder, id);
      }
      showNotification(
        `Marked ${emailIds.length} email(s) as unread`,
        "success"
      );
      await refreshEmail(currentFolder);
    } catch (err) {
      console.error("Error marking as unread:", err);
      showNotification("Gagal menandai sebagai belum dibaca", "error");
    } finally {
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  const flagEmail = async (emailIds, currentFolder) => {
    setActionLoading(true); // [CHANGE] Set global loading
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
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  const unflagEmail = async (emailIds, currentFolder) => {
    setActionLoading(true); // [CHANGE] Set global loading
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
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  const moveEmail = async (emailIds, targetFolder, currentFolder) => {
    setActionLoading(true); // [CHANGE] Set global loading
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
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  const deleteEmails = async (emailIds) => {
    setActionLoading(true); // [CHANGE] Set global loading
    try {
      const response = await deletePermanentApi(emailIds);
      if (response.success) {
        showNotification(`Deleted ${emailIds.length} email(s)`, "success");
        await refreshEmail("inbox"); // default refresh ke inbox
      } else {
        throw new Error(response.message || "Failed to delete emails");
      }
    } catch (err) {
      console.error(err);
      showNotification("Gagal menghapus email", "error");
    } finally {
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  // === PROVIDER VALUE ===
  const value = {
    emails,
    pagination,
    currentPage,
    perPage,
    selectedEmailIds,
    allEmails,
    fetchEmail,
    refreshEmail,
    markAsRead,
    markAsUnread,
    flagEmail,
    unflagEmail,
    moveEmail,
    deleteEmails,
    showNotification,
    setCurrentPage,
    setPerPage,
    setSelectedEmailIds,
    isAnyActionLoading, // [CHANGE] Added to context
    setActionLoading, // [CHANGE] Added to context
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
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
