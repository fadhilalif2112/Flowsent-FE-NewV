// src/components/EmailList.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Trash2,
  FolderInput,
  Mail,
  MailOpen,
  Star,
  StarOff,
  Search,
  X,
  Inbox,
  Archive,
  Folder,
  FileWarning,
} from "lucide-react";
import EmailRow from "./EmailRow";
import ConfirmDialog from "./common/ConfirmDialog";
import LoadingSpinner from "./common/LoadingSpinner";
import { useEmail } from "../contexts/EmailContext";

function EmailList({ folder, selectedEmail, onSelectEmail }) {
  const {
    emails,
    pagination,
    selectedEmailIds,
    setSelectedEmailIds,
    markAsRead,
    markAsUnread,
    flagEmail,
    unflagEmail,
    moveEmail,
    deleteEmails,
    isAnyActionLoading, // [CHANGE] Added
    setActionLoading, // [CHANGE] Added
  } = useEmail();

  const [searchTerm, setSearchTerm] = useState("");
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingActions, setLoadingActions] = useState({
    "mark-read": false,
    "mark-unread": false,
    star: false,
    unstar: false,
    move: false,
    delete: false,
  });
  const isStarredFolder = folder?.toLowerCase() === "starred";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".move-menu-container")) setShowMoveMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const folders = [
    { id: "inbox", name: "Inbox", icon: Inbox },
    { id: "draft", name: "Drafts", icon: FileWarning },
    { id: "sent", name: "Sent", icon: Mail },
    { id: "starred", name: "Starred", icon: Star },
    { id: "archive", name: "Archive", icon: Archive },
    { id: "junk", name: "Junk", icon: Folder },
    { id: "deleted", name: "Deleted", icon: Trash2 },
  ];

  const allSelected =
    emails.length > 0 && selectedEmailIds.length === emails.length;
  const someSelected =
    selectedEmailIds.length > 0 && selectedEmailIds.length < emails.length;

  const toggleSelectEmail = (id) => {
    setSelectedEmailIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (allSelected) setSelectedEmailIds([]);
    else setSelectedEmailIds(emails.map((e) => e.messageId));
  };

  const handleBulkAction = async (action, targetFolder = null) => {
    const ids = selectedEmailIds;
    if (ids.length === 0) return;

    setLoadingActions((prev) => ({ ...prev, [action]: true }));
    setActionLoading(true); // [CHANGE] Set global loading
    try {
      switch (action) {
        case "mark-read":
          await markAsRead(ids, folder);
          break;
        case "mark-unread":
          await markAsUnread(ids, folder);
          break;
        case "star":
          await flagEmail(ids, folder);
          break;
        case "unstar":
          await unflagEmail(ids, folder);
          break;
        case "move":
          await moveEmail(ids, targetFolder, folder);
          break;
        case "delete":
          setConfirmDelete(true);
          break;
        default:
          console.log("Unknown action:", action);
      }
    } catch (err) {
      console.error(`Error in ${action}:`, err);
    } finally {
      if (action !== "delete") {
        setLoadingActions((prev) => ({ ...prev, [action]: false }));
        setActionLoading(false); // [CHANGE] Reset global loading
      }
    }
  };

  const confirmDeleteAction = async () => {
    setLoadingActions((prev) => ({ ...prev, delete: true }));
    setActionLoading(true); // [CHANGE] Set global loading
    try {
      await deleteEmails(selectedEmailIds);
      setSelectedEmailIds([]);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setConfirmDelete(false);
      setLoadingActions((prev) => ({ ...prev, delete: false }));
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  const getBodyAsString = (body) => {
    if (!body) return "";
    if (typeof body === "string") return body;
    if (body.text) return body.text;
    if (body.html) return body.html.replace(/<[^>]*>/g, " ");
    return "";
  };

  const filteredEmails = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    if (!term) return emails;
    return emails.filter((e) => {
      const subject = (e.subject || "").toLowerCase();
      const sender = (e.sender || e.from || "").toLowerCase();
      const body = getBodyAsString(e.body).toLowerCase();
      return (
        subject.includes(term) || sender.includes(term) || body.includes(term)
      );
    });
  }, [emails, searchTerm]);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Header Toolbar */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => input && (input.indeterminate = someSelected)}
            onChange={handleSelectAll}
            className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
          />
          {!selectedEmail || selectedEmailIds.length === 0 ? (
            <>
              <h2 className="text-base sm:text-lg font-semibold capitalize">
                {folder}
              </h2>
              {pagination && (
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {pagination.total} email{pagination.total > 1 && "s"}
                </span>
              )}
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative flex items-center ml-auto w-full max-w-[300px]">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedEmailIds.length > 0 && (
            <div
              className={`flex items-center space-x-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2 py-1.5 shadow-sm transition-colors ${
                isStarredFolder
                  ? "opacity-60 pointer-events-none select-none"
                  : ""
              }`}
            >
              {!selectedEmail && (
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mr-2 hidden md:block">
                  {selectedEmailIds.length} selected
                </span>
              )}

              {[
                {
                  action: "mark-read",
                  icon: MailOpen,
                  title: "Mark as read",
                  message: "Marking as read...",
                },
                {
                  action: "mark-unread",
                  icon: Mail,
                  title: "Mark as unread",
                  message: "Marking as unread...",
                },
                {
                  action: "star",
                  icon: Star,
                  title: "Star",
                  message: "Starring...",
                },
                {
                  action: "unstar",
                  icon: StarOff,
                  title: "Unstar",
                  message: "Unstarring...",
                },
              ].map(({ action, icon: Icon, title, message }) => (
                <button
                  key={action}
                  onClick={() => handleBulkAction(action)}
                  disabled={
                    isStarredFolder ||
                    loadingActions[action] ||
                    isAnyActionLoading
                  } // [CHANGE] Added isAnyActionLoading
                  className={`p-1.5 rounded-lg transition ${
                    isStarredFolder ||
                    loadingActions[action] ||
                    isAnyActionLoading
                      ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title={title}
                >
                  {loadingActions[action] ? (
                    <LoadingSpinner message={message} />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </button>
              ))}

              <div className="relative move-menu-container">
                <button
                  onClick={() =>
                    !isStarredFolder && setShowMoveMenu((prev) => !prev)
                  }
                  disabled={
                    isStarredFolder || loadingActions.move || isAnyActionLoading
                  } // [CHANGE] Added isAnyActionLoading
                  title="Move to folder"
                  className={`p-1.5 rounded-lg transition ${
                    isStarredFolder || loadingActions.move || isAnyActionLoading
                      ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {loadingActions.move ? (
                    <LoadingSpinner message="Moving..." />
                  ) : (
                    <FolderInput className="w-4 h-4" />
                  )}
                </button>

                {!isStarredFolder && showMoveMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 py-1">
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          if (f.id === folder) return;
                          handleBulkAction("move", f.id);
                          setShowMoveMenu(false);
                        }}
                        disabled={
                          f.id === folder ||
                          loadingActions.move ||
                          isAnyActionLoading
                        } // [CHANGE] Added isAnyActionLoading
                        className={`w-full text-left px-4 py-2 text-sm transition ${
                          f.id === folder ||
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

              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>

              <button
                onClick={() => handleBulkAction("delete")}
                disabled={
                  isStarredFolder || loadingActions.delete || isAnyActionLoading
                } // [CHANGE] Added isAnyActionLoading
                className={`p-1.5 rounded-lg transition ${
                  isStarredFolder || loadingActions.delete || isAnyActionLoading
                    ? "text-red-300 dark:text-red-700 cursor-not-allowed"
                    : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300"
                }`}
                title="Delete"
              >
                {loadingActions.delete ? (
                  <LoadingSpinner message="Deleting..." />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 && !pagination ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Inbox className="w-10 h-10 text-slate-400 dark:text-slate-600" />
            <p className="text-sm">
              {searchTerm
                ? "No results found for your search."
                : `No emails in your ${folder} folder.`}
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <EmailRow
              key={email.messageId}
              email={email}
              isSelected={selectedEmail?.messageId === email.messageId}
              isChecked={selectedEmailIds.includes(email.messageId)}
              onClick={() => onSelectEmail(email)}
              onToggleCheck={() => toggleSelectEmail(email.messageId)}
            />
          ))
        )}
      </div>

      {/* Confirm Delete */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Selected Emails"
          message={`Are you sure you want to delete ${selectedEmailIds.length} email(s)?`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default EmailList;
