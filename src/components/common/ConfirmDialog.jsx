// src/components/common/ConfirmDialog.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * ConfirmDialog Component
 * Dialog konfirmasi untuk aksi penting seperti delete, discard, dll
 *
 * @param {string} title - Judul dialog (default: "Confirm Action")
 * @param {string} message - Pesan konfirmasi
 * @param {string} confirmText - Text tombol confirm (default: "Confirm")
 * @param {string} cancelText - Text tombol cancel (default: "Cancel")
 * @param {string} variant - Variant style: 'danger' | 'warning' | 'primary' (default: 'danger')
 * @param {function} onConfirm - Callback saat user confirm
 * @param {function} onCancel - Callback saat user cancel
 * @param {boolean} loading - Status loading saat proses confirm
 */
function ConfirmDialog({
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  // Konfigurasi variant
  const variantConfig = {
    danger: {
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      confirmBg:
        "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    },
    warning: {
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      confirmBg:
        "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
    },
    primary: {
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      confirmBg:
        "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600",
    },
  };

  const config = variantConfig[variant] || variantConfig.danger;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header dengan Icon */}
        <div className="px-6 pt-6 pb-4">
          <div
            className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mb-4`}
          >
            <AlertTriangle className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          <h3
            id="dialog-title"
            className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2"
          >
            {title}
          </h3>

          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
              px-5 py-2.5 ${config.confirmBg}
              text-white font-semibold rounded-lg 
              transition shadow-sm hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center space-x-2
            `}
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            <span>{loading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
