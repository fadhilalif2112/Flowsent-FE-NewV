// src/components/EmailReader.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Reply,
  Forward,
  Star,
  MailOpen,
  FolderInput,
  Download,
  Mail,
} from "lucide-react";
import { formatDate } from "../utils/formatDate";
import { getFilePreview } from "../utils/fileUtils";
import { useEmail } from "../contexts/EmailContext";
import LoadingSpinner from "./common/LoadingSpinner";

function EmailReader({ email, onClose, onReply, onForward }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [loadingActions, setLoadingActions] = useState({
    flag: false,
    unflag: false,
    "mark-read": false,
    "mark-unread": false,
    move: false,
    delete: false,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    markAsRead,
    markAsUnread,
    flagEmail,
    unflagEmail,
    moveEmail,
    deleteEmails,
    isAnyActionLoading,
    setActionLoading,
  } = useEmail();

  const folders = [
    { id: "inbox", name: "Inbox" },
    { id: "starred", name: "Starred" },
    { id: "archive", name: "Archive" },
    { id: "junk", name: "Junk" },
    { id: "deleted", name: "Deleted" },
  ];

  const emailId = email.messageId;
  const currentFolder = email.folder || "inbox";

  // Auto mark as read for unread emails on component mount
  useEffect(() => {
    if (!email.seen && !isAnyActionLoading) {
      const autoMarkAsRead = async () => {
        setLoadingActions((prev) => ({ ...prev, "mark-read": true }));
        setActionLoading(true);
        try {
          await markAsRead([emailId], currentFolder);
        } catch (err) {
          console.error("Auto mark as read error:", err);
        } finally {
          setLoadingActions((prev) => ({ ...prev, "mark-read": false }));
          setActionLoading(false);
        }
      };
      autoMarkAsRead();
    }
  }, [
    email.seen,
    emailId,
    currentFolder,
    markAsRead,
    isAnyActionLoading,
    setActionLoading,
  ]);

  /* ------------------------------------------------------------------ */
  /* 1. Toggle Star (flag / unflag)                                      */
  /* ------------------------------------------------------------------ */
  const handleToggleStar = async () => {
    const action = email.flagged ? "unflag" : "flag";
    setLoadingActions((prev) => ({ ...prev, [action]: true }));
    setActionLoading(true);
    try {
      if (email.flagged) {
        await unflagEmail([emailId], currentFolder);
      } else {
        await flagEmail([emailId], currentFolder);
      }
    } catch (err) {
      console.error("Toggle flag error:", err);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [action]: false }));
      setActionLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* 2. Mark as Unread & Mark as Read                                   */
  /* ------------------------------------------------------------------ */
  const handleMarkAsUnread = async () => {
    setLoadingActions((prev) => ({ ...prev, "mark-unread": true }));
    setActionLoading(true);
    try {
      await markAsUnread([emailId], currentFolder);
    } catch (err) {
      console.error("Mark as unread error:", err);
    } finally {
      setLoadingActions((prev) => ({ ...prev, "mark-unread": false }));
      setActionLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    setLoadingActions((prev) => ({ ...prev, "mark-read": true }));
    setActionLoading(true);
    try {
      await markAsRead([emailId], currentFolder);
    } catch (err) {
      console.error("Mark as read error:", err);
    } finally {
      setLoadingActions((prev) => ({ ...prev, "mark-read": false }));
      setActionLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* 3. Move to folder                                                   */
  /* ------------------------------------------------------------------ */
  const handleMove = async (targetFolder) => {
    if (targetFolder === currentFolder) return;
    setShowMoveMenu(false);
    setLoadingActions((prev) => ({ ...prev, move: true }));
    setActionLoading(true);
    try {
      await moveEmail([emailId], targetFolder, currentFolder);
      onClose(); // Close after notification and optimistic update
    } catch (err) {
      console.error("Move error:", err);
    } finally {
      setLoadingActions((prev) => ({ ...prev, move: false }));
      setActionLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* 5. Download attachment                                              */
  /* ------------------------------------------------------------------ */
  const handleDownloadAttachment = (attachment) => {
    window.open(attachment.download_url, "_blank");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 shadow-sm">
        <button
          onClick={onClose}
          className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-1">
          <button
            onClick={onReply}
            title="Reply"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Reply className="w-5 h-5" />
          </button>
          <button
            onClick={onForward}
            title="Forward"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Forward className="w-5 h-5" />
          </button>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={handleToggleStar}
            disabled={
              loadingActions.flag || loadingActions.unflag || isAnyActionLoading
            }
            title={email.flagged ? "Unflag" : "Flag"}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {loadingActions.flag || loadingActions.unflag ? (
              <LoadingSpinner
                message={email.flagged ? "Unflagging..." : "Flagging..."}
              />
            ) : (
              <Star
                className={`w-5 h-5 ${
                  email.flagged ? "text-amber-500 fill-amber-500" : ""
                }`}
              />
            )}
          </button>

          <button
            onClick={handleMarkAsRead}
            disabled={loadingActions["mark-read"] || isAnyActionLoading}
            title="Mark as Read"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {loadingActions["mark-read"] ? (
              <LoadingSpinner message="Marking as read..." />
            ) : (
              <MailOpen className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={handleMarkAsUnread}
            disabled={loadingActions["mark-unread"] || isAnyActionLoading}
            title="Mark as Unread"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {loadingActions["mark-unread"] ? (
              <LoadingSpinner message="Marking as unread..." />
            ) : (
              <Mail className="w-5 h-5" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMoveMenu((s) => !s)}
              disabled={loadingActions.move || isAnyActionLoading}
              title="Move"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {loadingActions.move ? (
                <LoadingSpinner message="Moving..." />
              ) : (
                <FolderInput className="w-5 h-5" />
              )}
            </button>

            {showMoveMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 py-1">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMove(f.id)}
                    disabled={
                      loadingActions.move ||
                      f.id === currentFolder ||
                      isAnyActionLoading
                    }
                    className={`w-full text-left px-4 py-2 text-sm transition ${
                      f.id === currentFolder ||
                      loadingActions.move ||
                      isAnyActionLoading
                        ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        : "text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="hidden lg:block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Email Body --------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Subject */}
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            {email.subject || "(No Subject)"}
          </h1>

          {/* Sender */}
          <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {email.sender?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {email.sender}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {email.senderEmail}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {formatDate(email.timestamp)}
              </div>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium">To:</span>{" "}
              {email.recipients?.map((r, i) => (
                <span key={i}>
                  {r.email}
                  {i < email.recipients.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-6">
            {email.body?.html ? (
              <div
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: email.body.html }}
              />
            ) : (
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {email.body?.text}
              </div>
            )}
          </div>

          {/* Attachments */}
          {email.rawAttachments?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-2">
                <span>Attachments</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  ({email.rawAttachments.length})
                </span>
              </h3>
              <div className="space-y-2">
                {email.rawAttachments.map((a, i) => {
                  const previewIcon = getFilePreview({
                    name: a.filename,
                    url: a.download_url,
                  });
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={previewIcon}
                          alt="File"
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 p-1"
                        />
                        <div className="min-w-0">
                          <div className="text-slate-900 dark:text-slate-100 font-medium truncate">
                            {a.filename}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatFileSize(a.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadAttachment(a)}
                        title="Download"
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailReader;
