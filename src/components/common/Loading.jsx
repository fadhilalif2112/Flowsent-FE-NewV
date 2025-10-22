// src/components/common/Loading.jsx
import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading Component
 * Overlay loading spinner yang muncul di tengah layar
 *
 * @param {string} message - Pesan loading (default: "Loading...")
 */
function Loading({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 border border-slate-200 dark:border-slate-700 min-w-[280px] animate-in zoom-in-95 duration-200">
        {/* Spinner */}
        <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />

        {/* Message */}
        <div className="text-slate-700 dark:text-slate-300 font-medium text-center">
          {message}
        </div>

        {/* Progress dots animation */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

export default Loading;
