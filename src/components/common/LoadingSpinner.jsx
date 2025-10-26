// src/components/common/LoadingSpinner.jsx
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
};

export default LoadingSpinner;
