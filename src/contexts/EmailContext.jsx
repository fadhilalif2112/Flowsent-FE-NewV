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
  deletePermanentAllApi,
  downloadAttachmentApi,
  previewAttachmentApi,
} from "../services/api";
import Notification from "../components/common/Notification";
import useOptimisticUpdate from "../hooks/useOptimisticUpdate";

const EmailContext = createContext();
export const useEmail = () => useContext(EmailContext);

export function EmailProvider({ children }) {
  // === STATE ===
  const [allEmails, setAllEmails] = useState([]);
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isAnyActionLoading, setActionLoading] = useState(false);

  const { applyOptimisticUpdate, rollbackUpdate, clearPreviousState } =
    useOptimisticUpdate();

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
    setActionLoading(true);
    try {
      for (const id of emailIds) {
        await markAsReadApi(currentFolder, id);
      }
      showNotification(`Marked ${emailIds.length} email(s) as read`, "success");
      const { updatedAllEmails, updatedEmails } = applyOptimisticUpdate(
        allEmails,
        emails,
        "markAsRead",
        emailIds
      );
      setAllEmails(updatedAllEmails);
      setEmails(updatedEmails);
      clearPreviousState();
    } catch (err) {
      console.error("Error marking as read:", err);
      showNotification("Gagal menandai sebagai sudah dibaca", "error");
      const rollbackState = rollbackUpdate();
      if (rollbackState) {
        setAllEmails(rollbackState.updatedAllEmails);
        setEmails(rollbackState.updatedEmails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const markAsUnread = async (emailIds, currentFolder) => {
    setActionLoading(true);
    try {
      for (const id of emailIds) {
        await markAsUnreadApi(currentFolder, id);
      }
      showNotification(
        `Marked ${emailIds.length} email(s) as unread`,
        "success"
      );
      const { updatedAllEmails, updatedEmails } = applyOptimisticUpdate(
        allEmails,
        emails,
        "markAsUnread",
        emailIds
      );
      setAllEmails(updatedAllEmails);
      setEmails(updatedEmails);
      clearPreviousState();
    } catch (err) {
      console.error("Error marking as unread:", err);
      showNotification("Gagal menandai sebagai belum dibaca", "error");
      const rollbackState = rollbackUpdate();
      if (rollbackState) {
        setAllEmails(rollbackState.updatedAllEmails);
        setEmails(rollbackState.updatedEmails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const flagEmail = async (emailIds, currentFolder) => {
    setActionLoading(true);
    try {
      for (const id of emailIds) {
        await markAsFlaggedApi(currentFolder, id);
      }
      showNotification(`Flagged ${emailIds.length} email(s)`, "success");
      const { updatedAllEmails, updatedEmails } = applyOptimisticUpdate(
        allEmails,
        emails,
        "flagEmail",
        emailIds
      );
      setAllEmails(updatedAllEmails);
      setEmails(updatedEmails);
      clearPreviousState();
    } catch (err) {
      console.error("Error flagging email:", err);
      showNotification("Gagal menandai bendera", "error");
      const rollbackState = rollbackUpdate();
      if (rollbackState) {
        setAllEmails(rollbackState.updatedAllEmails);
        setEmails(rollbackState.updatedEmails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const unflagEmail = async (emailIds, currentFolder) => {
    setActionLoading(true);
    try {
      for (const id of emailIds) {
        await markAsUnflaggedApi(currentFolder, id);
      }
      showNotification(`Unflagged ${emailIds.length} email(s)`, "success");
      const { updatedAllEmails, updatedEmails } = applyOptimisticUpdate(
        allEmails,
        emails,
        "unflagEmail",
        emailIds
      );
      setAllEmails(updatedAllEmails);
      setEmails(updatedEmails);
      clearPreviousState();
    } catch (err) {
      console.error("Error unflagging email:", err);
      showNotification("Gagal menghapus bendera", "error");
      const rollbackState = rollbackUpdate();
      if (rollbackState) {
        setAllEmails(rollbackState.updatedAllEmails);
        setEmails(rollbackState.updatedEmails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const moveEmail = async (emailIds, targetFolder, currentFolder) => {
    setActionLoading(true);
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
        const { updatedAllEmails, updatedEmails } = applyOptimisticUpdate(
          allEmails,
          emails,
          "moveEmail",
          emailIds,
          { targetFolder }
        );
        setAllEmails(updatedAllEmails);
        setEmails(updatedEmails);
        clearPreviousState();
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
      const rollbackState = rollbackUpdate();
      if (rollbackState) {
        setAllEmails(rollbackState.updatedAllEmails);
        setEmails(rollbackState.updatedEmails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const deleteEmails = async (emailIds) => {
    setActionLoading(true);
    try {
      const response = await deletePermanentApi(emailIds);
      if (response.success) {
        showNotification(`Deleted ${emailIds.length} email(s)`, "success");
        const { updatedAllEmails, updatedEmails } = applyOptimisticUpdate(
          allEmails,
          emails,
          "deleteEmails",
          emailIds
        );
        setAllEmails(updatedAllEmails);
        setEmails(updatedEmails);
        clearPreviousState();
      } else {
        throw new Error(response.message || "Failed to delete emails");
      }
    } catch (err) {
      console.error(err);
      showNotification("Gagal menghapus email", "error");
      const rollbackState = rollbackUpdate();
      if (rollbackState) {
        setAllEmails(rollbackState.updatedAllEmails);
        setEmails(rollbackState.updatedEmails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const deletePermanentAll = async () => {
    setActionLoading(true);
    try {
      const response = await deletePermanentAllApi();
      if (response.success) {
        // Changed from response.status === "success" to response.success
        showNotification("All emails in Deleted folder removed", "success");
        const { updatedAllEmails, updatedEmails } = applyOptimisticUpdate(
          allEmails,
          emails,
          "deletePermanentAll",
          []
        );
        setAllEmails(updatedAllEmails);
        setEmails(updatedEmails);
        clearPreviousState();
      } else {
        throw new Error(response.message || "Failed to delete all emails");
      }
    } catch (err) {
      console.error("Error deleting all emails:", err);
      showNotification("Gagal menghapus semua email", "error");
      const rollbackState = rollbackUpdate();
      if (rollbackState) {
        setAllEmails(rollbackState.updatedAllEmails);
        setEmails(rollbackState.updatedEmails);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // === HANDLERS: ATTACHMENT OPERATIONS ===
  const downloadAttachment = async (emailUid, filename) => {
    try {
      await downloadAttachmentApi(emailUid, filename);
      showNotification(`Downloading ${filename}`, "success");
    } catch (err) {
      console.error("Download error:", err);
      showNotification(`Failed to download ${filename}`, "error");
      throw err;
    }
  };

  // Preview attachment with fallback to download
  const previewAttachment = async (emailUid, filename) => {
    try {
      const result = await previewAttachmentApi(emailUid, filename);

      if (result.fallbackDownload) {
        showNotification(
          "This file type cannot be previewed. Downloading instead...",
          "info"
        );
        await downloadAttachment(emailUid, filename);
        return { fallbackDownload: true };
      }

      return result;
    } catch (err) {
      console.error("Preview error:", err);
      showNotification(`Failed to preview ${filename}`, "error");
      throw err;
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
    deletePermanentAll, // Add new function to context
    downloadAttachment,
    previewAttachment,
    showNotification,
    setCurrentPage,
    setPerPage,
    setSelectedEmailIds,
    isAnyActionLoading,
    setActionLoading,
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
