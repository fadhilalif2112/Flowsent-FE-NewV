// src/components/EmailRow.jsx
import React, { useState } from "react";
import { Star, Reply, Paperclip, Download, Eye, Loader2 } from "lucide-react";
import { formatDate } from "../utils/formatDate";
import { getFilePreview } from "../utils/fileUtils";
import { useEmail } from "../contexts/EmailContext";
import PreviewModal from "./PreviewModal";

function EmailRow({ email, isSelected, isChecked, onClick, onToggleCheck }) {
  const {
    flagEmail,
    unflagEmail,
    isAnyActionLoading,
    downloadAttachment,
    previewAttachment,
  } = useEmail();

  const [isStarLoading, setIsStarLoading] = useState(false);
  const [previewLoadings, setPreviewLoadings] = useState({});
  const [downloadLoadings, setDownloadLoadings] = useState({}); // ✅ loader baru untuk tombol download
  const [currentPreview, setCurrentPreview] = useState(null);

  const handleStarClick = async (e) => {
    e.stopPropagation();
    setIsStarLoading(true);
    try {
      const currentFolder = email.folder || "inbox";
      if (email.flagged) {
        await unflagEmail([email.messageId], currentFolder);
      } else {
        await flagEmail([email.messageId], currentFolder);
      }
    } catch (error) {
      console.error("Failed to toggle star:", error);
    } finally {
      setIsStarLoading(false);
    }
  };

  const handleCheckboxClick = (e) => e.stopPropagation();

  const isNew = () => {
    const emailDate = new Date(email.timestamp);
    const now = new Date();
    return now - emailDate < 24 * 60 * 60 * 1000;
  };

  const handleDownload = async (attachment, index) => {
    setDownloadLoadings((prev) => ({ ...prev, [index]: true })); // ✅ aktifkan loader
    try {
      await downloadAttachment(email.uid, attachment.filename);
    } catch (error) {
      console.error("Failed to download attachment:", error);
    } finally {
      setDownloadLoadings((prev) => ({ ...prev, [index]: false })); // ✅ matikan loader
    }
  };

  const handlePreview = async (attachment, index) => {
    setPreviewLoadings((prev) => ({ ...prev, [index]: true }));
    try {
      const result = await previewAttachment(email.uid, attachment.filename);
      if (result.fallbackDownload) {
        await downloadAttachment(email.uid, attachment.filename);
      } else {
        setCurrentPreview({
          url: result.url,
          type: result.mimeType,
          filename: result.filename,
        });
      }
    } catch (error) {
      console.error("Failed to preview attachment:", error);
    } finally {
      setPreviewLoadings((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div
      onClick={onClick}
      className={`px-3 sm:px-6 py-3 sm:py-4 cursor-pointer transition-all border-l-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
        isSelected
          ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-indigo-600"
          : "border-l-transparent"
      } ${
        !email.seen ? "bg-blue-100/30 dark:bg-blue-900/10" : ""
      } border-b border-slate-100 dark:border-slate-700 last:border-b-0`}
    >
      <div className="flex items-start space-x-2 sm:space-x-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 mt-1" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={onToggleCheck}
            className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
          />
        </div>

        {/* Star/Flag */}
        <button
          onClick={handleStarClick}
          disabled={isStarLoading || isAnyActionLoading}
          className={`flex-shrink-0 mt-1 transition-colors focus:outline-none ${
            isStarLoading
              ? "text-indigo-500"
              : "text-slate-400 dark:text-slate-500 hover:text-amber-500"
          }`}
          aria-label={email.flagged ? "Unflag" : "Flag"}
        >
          {isStarLoading ? (
            <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
          ) : (
            <Star
              className={`w-4 sm:w-5 h-4 sm:h-5 ${
                email.flagged ? "text-amber-500 fill-amber-500" : ""
              }`}
            />
          )}
        </button>

        {/* Email Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <span
                className={`text-xs sm:text-sm truncate ${
                  !email.seen
                    ? "font-semibold text-slate-900 dark:text-slate-100"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {email.sender}
              </span>
              {email.answered && (
                <Reply className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 flex-shrink-0" />
              )}
              {email.rawAttachments && email.rawAttachments.length > 0 && (
                <Paperclip className="w-3 sm:w-4 h-3 sm:h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              )}
              {!email.seen && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded-full ml-2">
                  Unread
                </span>
              )}
              {isNew() && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800 px-2 py-0.5 rounded-full ml-2">
                  New
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 sm:ml-3 flex-shrink-0 font-medium">
              {formatDate(email.timestamp)}
            </span>
          </div>

          <div
            className={`text-xs sm:text-sm mb-1 truncate ${
              !email.seen
                ? "font-semibold text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {email.subject || "(No Subject)"}
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {email.preview}
          </p>

          {/* Attachments Section */}
          {email.rawAttachments && email.rawAttachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {email.rawAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-xs w-auto max-w-[150px]"
                >
                  <img
                    src={getFilePreview({ name: attachment.filename })}
                    alt="Attachment preview"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {attachment.filename || `Attachment ${index + 1}`}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(attachment, index);
                      }}
                      disabled={previewLoadings[index] || isAnyActionLoading}
                      className={`focus:outline-none ${
                        previewLoadings[index]
                          ? "text-indigo-500"
                          : "text-blue-500 hover:text-blue-700"
                      }`}
                      aria-label="Preview attachment"
                    >
                      {previewLoadings[index] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(attachment, index);
                      }}
                      disabled={downloadLoadings[index] || isAnyActionLoading}
                      className={`focus:outline-none ${
                        downloadLoadings[index]
                          ? "text-green-500"
                          : "text-green-500 hover:text-green-700"
                      }`}
                      aria-label="Download attachment"
                    >
                      {downloadLoadings[index] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentPreview && (
        <PreviewModal
          url={currentPreview.url}
          type={currentPreview.type}
          filename={currentPreview.filename}
          onClose={() => setCurrentPreview(null)}
        />
      )}
    </div>
  );
}

export default EmailRow;
