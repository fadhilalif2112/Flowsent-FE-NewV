// src/components/common/Notification.jsx
import React, { useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

/**
 * Notification Component
 * Menampilkan pesan notifikasi dengan berbagai tipe (success, error, info, warning)
 *
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe notifikasi: 'success' | 'error' | 'info' | 'warning'
 * @param {function} onClose - Callback saat notifikasi ditutup
 * @param {number} duration - Durasi auto-hide dalam ms (default: 5000)
 */
function Notification({ message, type = "info", onClose, duration = 5000 }) {
  // Auto-hide setelah duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Konfigurasi untuk setiap tipe notifikasi
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-green-800 dark:text-green-200",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      iconColor: "text-red-600 dark:text-red-400",
      textColor: "text-red-800 dark:text-red-200",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      iconColor: "text-amber-600 dark:text-amber-400",
      textColor: "text-amber-800 dark:text-amber-200",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-blue-800 dark:text-blue-200",
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed top-20 right-4 z-50 
        min-w-[320px] max-w-md
        ${config.bgColor} ${config.borderColor}
        border rounded-xl shadow-lg
        p-4 flex items-start space-x-3
        animate-in slide-in-from-right-5 fade-in duration-300
      `}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
      </div>

      {/* Message */}
      <div className={`flex-1 ${config.textColor} text-sm font-medium`}>
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className={`
          flex-shrink-0 ${config.iconColor}
          hover:opacity-70 transition-opacity
          p-1 rounded-lg
        `}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Notification;
