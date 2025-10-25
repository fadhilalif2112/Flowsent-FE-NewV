import React, { useState, useEffect, useRef } from "react";
import { X, Paperclip, Send } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { sendEmailApi, saveDraftApi } from "../services/api";
import { useEmail } from "../contexts/EmailContext";
import ConfirmDialog from "../components/common/ConfirmDialog";

function ComposeModal({ mode = "new", originalEmail = null, onClose, onSent }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [linkDialog, setLinkDialog] = useState({
    show: false,
    selection: null,
  });
  const [linkUrl, setLinkUrl] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [errors, setErrors] = useState({});

  const { setLoading, setLoadingMessage, showNotification, refreshEmail } =
    useEmail();
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize form based on mode
  useEffect(() => {
    if (mode === "reply" || mode === "reply-all") {
      setTo(originalEmail?.senderEmail || "");
      setSubject(`Re: ${originalEmail?.subject || ""}`);
      const originalText = originalEmail?.body?.text || "";
      const formattedBody = `<p><br/><br/>---<br/>On ${
        originalEmail?.timestamp
      }, ${originalEmail?.sender} wrote:<br/>${originalText.replace(
        /\n/g,
        "<br/>"
      )}</p>`;
      setBody(formattedBody);
      setAttachments([]);
    } else if (mode === "forward") {
      setSubject(`Fwd: ${originalEmail?.subject || ""}`);
      const originalText = originalEmail?.body?.text || "";
      const formattedBody = `<p><br/><br/>---<br/>Forwarded message:<br/>From: ${
        originalEmail?.sender
      } &lt;${originalEmail?.senderEmail}&gt;<br/>Date: ${
        originalEmail?.timestamp
      }<br/>Subject: ${originalEmail?.subject}<br/><br/>${originalText.replace(
        /\n/g,
        "<br/>"
      )}</p>`;
      setBody(formattedBody);
      setAttachments([]);
    } else if (mode === "edit-draft") {
      setTo(originalEmail?.recipients?.[0]?.email || originalEmail?.to || "");
      setSubject(originalEmail?.subject || "");
      setBody(originalEmail?.body?.html || originalEmail?.body?.text || "");
      if (originalEmail?.rawAttachments) {
        const normalizedAttachments = originalEmail.rawAttachments.map(
          (att) => ({
            name: att.filename,
            size: att.size,
            mime: att.mime_type || "application/octet-stream",
            downloadUrl: att.download_url,
            isServer: true,
          })
        );
        setAttachments(normalizedAttachments);
      } else {
        setAttachments([]);
      }
    } else {
      setTo("");
      setSubject("");
      setBody("");
      setAttachments([]);
    }
    setErrors({});
  }, [mode, originalEmail]);

  // Quill toolbar configuration
  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        link: function (value) {
          if (value) {
            const range = this.quill.getSelection();
            setLinkDialog({ show: true, selection: range });
            setLinkUrl("");
          } else {
            this.quill.format("link", false);
          }
        },
      },
    },
  };

  // Validate email addresses
  const validateEmails = (emails) => {
    if (!emails.trim()) return false;
    const emailList = emails
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter((e) => e);
    return (
      emailList.length > 0 &&
      emailList.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    );
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!to.trim()) newErrors.to = "Recipient email is required";
    else if (!validateEmails(to)) newErrors.to = "Invalid email address(es)";
    if (!subject.trim()) newErrors.subject = "Subject is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversized = files.filter((f) => f.size > maxSize);
    if (oversized.length > 0) {
      showNotification(
        `Files too large (max 10MB): ${oversized
          .map((f) => f.name)
          .join(", ")}`,
        "error"
      );
      return;
    }

    const newAttachments = files.map((file) => ({
      name: file.name,
      size: file.size,
      file,
      mime: file.type || "application/octet-stream",
      isServer: false,
    }));
    setAttachments([...attachments, ...newAttachments]);
    showNotification(`${files.length} file(s) attached`, "success");
  };

  // Remove attachment
  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    showNotification("Attachment removed", "info");
  };

  // Check if form has data
  const hasData = () => {
    const plainBody = body
      .replace(/<(.|\n)*?>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();
    return (
      to.trim() !== "" ||
      subject.trim() !== "" ||
      plainBody !== "" ||
      attachments.length > 0
    );
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (hasData()) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  // Handle sending email
  const handleSendEmail = async () => {
    if (!validateForm()) {
      showNotification("Please fix the validation errors", "error");
      return;
    }

    setLoading(true);
    setLoadingMessage("Sending email...");
    try {
      const newAttachments = attachments
        .filter((a) => !a.isServer)
        .map((a) => a.file);
      const storedAttachments = attachments
        .filter((a) => a.isServer)
        .map((a) => ({
          name: a.name,
          mime: a.mime,
          downloadUrl: a.downloadUrl,
        }));

      await sendEmailApi({
        to: to.trim(),
        subject: subject.trim(),
        body,
        attachments: newAttachments,
        draft_id: originalEmail?.draftId || null,
        stored_attachments: JSON.stringify(storedAttachments),
        message_id: originalEmail?.messageId || null,
      });

      showNotification("Email sent successfully!", "success");
      await refreshEmail("sent");
      onSent();
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      showNotification(error.message || "Failed to send email", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle saving draft
  const handleSaveDraft = async () => {
    setLoading(true);
    setLoadingMessage("Saving draft...");
    try {
      const newAttachments = attachments
        .filter((a) => !a.isServer)
        .map((a) => a.file);
      await saveDraftApi({
        to: to.trim(),
        subject: subject.trim() || "(No Subject)",
        body,
        attachments: newAttachments,
        draft_id: originalEmail?.draftId || null,
        message_id: originalEmail?.messageId || null,
      });
      showNotification("Draft saved successfully!", "success");
      await refreshEmail("drafts");
      onClose();
    } catch (error) {
      console.error("Error saving draft:", error);
      showNotification(error.message || "Failed to save draft", "error");
    } finally {
      setLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Apply link in editor
  const applyLink = () => {
    if (linkUrl && quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (linkDialog.selection) editor.setSelection(linkDialog.selection);
      const formattedUrl = linkUrl.match(/^https?:/)
        ? linkUrl
        : "https://" + linkUrl;
      editor.format("link", formattedUrl);
    }
    setLinkDialog({ show: false, selection: null });
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/50 backdrop-blur-[1.5px] flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 rounded-t-2xl border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {mode === "new" && "New Message"}
            {mode === "reply" && "Reply"}
            {mode === "reply-all" && "Reply All"}
            {mode === "forward" && "Forward"}
            {mode === "edit-draft" && "Edit Draft"}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* To */}
          <div>
            <label
              htmlFor="to"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              To
            </label>
            <input
              type="email"
              id="to"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                if (errors.to) setErrors({ ...errors, to: "" });
              }}
              className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 ${
                errors.to
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}
              placeholder="recipient@example.com"
              required
            />
            {errors.to && (
              <p className="text-red-500 text-xs mt-1">{errors.to}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors({ ...errors, subject: "" });
              }}
              className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 ${
                errors.subject
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}
              placeholder="Email subject"
              required
            />
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Body */}
          <div>
            <label
              htmlFor="body"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Message
            </label>
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 focus-within:border-transparent transition">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={body}
                onChange={setBody}
                modules={quillModules}
                placeholder="Type your message here..."
                className="min-h-[300px] !border-none !bg-transparent p-0 !m-0
                  [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-slate-300 dark:[&_.ql-toolbar]:!border-slate-700
                  [&_.ql-toolbar]:!bg-white dark:[&_.ql-toolbar]:!bg-slate-900
                  [&_.ql-container]:!border-none [&_.ql-editor]:!text-slate-900 dark:[&_.ql-editor]:!text-slate-100"
              />
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Attachments ({attachments.length})
              </label>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                        <Paperclip className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-slate-900 dark:text-slate-100 text-sm font-medium truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(file.size)}
                          {file.isServer && " (Stored)"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition ml-3"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 rounded-b-2xl border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                <Paperclip className="w-5 h-5" />
                <span className="text-sm font-medium">Attach</span>
              </div>
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Save Draft
            </button>
            <button
              onClick={handleSendEmail}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Link Dialog */}
      {linkDialog.show && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-96 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Insert Link
            </h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL (e.g., https://example.com)"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setLinkDialog({ show: false, selection: null })}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={applyLink}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Discard */}
      {confirmDiscard && (
        <ConfirmDialog
          title="Discard Draft"
          message="Are you sure you want to discard this draft? All changes will be lost."
          confirmText="Discard"
          cancelText="Cancel"
          variant="warning"
          onConfirm={() => {
            setConfirmDiscard(false);
            onClose();
          }}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </div>
  );
}

export default ComposeModal;
