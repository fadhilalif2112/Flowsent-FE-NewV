// src/services/emailHelpers.js
import { fetchAllEmails } from "./api";

let cachedEmails = [];

/**
 * Ambil semua email dari backend (cache-first)
 */
export const getAllEmails = async (forceRefresh = false) => {
  if (!forceRefresh && cachedEmails.length > 0) return cachedEmails;
  const emails = await fetchAllEmails();
  cachedEmails = emails;
  return emails;
};

/**
 * Filter berdasarkan folder
 */
export const getEmailsByFolder = async (folder) => {
  const emails = await getAllEmails();
  return emails.filter(
    (email) => email.folder?.toLowerCase() === folder.toLowerCase()
  );
};

/**
 * Ambil satu email berdasarkan messageId
 */
export const getEmailByMessageId = async (messageId) => {
  const emails = await getAllEmails();
  return emails.find((email) => email.messageId === messageId) || null;
};

/**
 * Pagination
 */
export const paginateEmails = (emails, page = 1, perPage = 20) => {
  const total = emails.length;
  const totalPages = Math.ceil(total / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  const data = emails.slice(startIndex, endIndex);

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

/**
 * Hitung jumlah email per folder
 */
export const getFolderCounts = async () => {
  const emails = await getAllEmails();
  const counts = {};
  emails.forEach((email) => {
    const folder = email.folder?.toLowerCase() || "inbox";
    counts[folder] = (counts[folder] || 0) + 1;
  });
  return counts;
};

/**
 * Hitung jumlah unread email per folder
 */
export const getUnreadCounts = async () => {
  const emails = await getAllEmails();
  const counts = {};
  emails.forEach((email) => {
    if (!email.seen) {
      const folder = email.folder?.toLowerCase() || "inbox";
      counts[folder] = (counts[folder] || 0) + 1;
    }
  });
  return counts;
};
