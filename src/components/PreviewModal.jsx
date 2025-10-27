import React, { useEffect } from "react";

const PreviewModal = ({ url, type, filename, onClose }) => {
  if (!url) return null;

  const isImage = type?.startsWith("image/");
  const isPdf = type === "application/pdf";
  const isText = type?.startsWith("text/");
  const isVideo = type?.startsWith("video/");

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  // Get file extension for display
  const fileExtension =
    filename?.split(".").pop()?.toUpperCase() ||
    type?.split("/")[1]?.toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
      onClick={onClose}
    >
      {/* Header Bar */}
      <div
        className="absolute top-0 left-0 right-0 bg-slate-900 border-b border-slate-700 h-14 flex items-center justify-between px-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left section - Close button */}
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
            title="Close (Esc)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Center section - File info */}
        <div className="flex items-center space-x-3 text-white">
          <div className="flex items-center space-x-2">
            {isImage && (
              <svg
                className="w-5 h-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isPdf && (
              <svg
                className="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isVideo && (
              <svg
                className="w-5 h-5 text-purple-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            )}
            {!isImage && !isPdf && !isVideo && (
              <svg
                className="w-5 h-5 text-slate-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="text-sm font-medium truncate max-w-xs">
              {filename || `File.${fileExtension}`}
            </span>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Download button */}
          <a
            href={url}
            download={filename}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
            title={`Download ${filename}`}
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>

          {/* Print button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isImage || isPdf) {
                const printFrame = document.createElement("iframe");
                printFrame.style.position = "fixed";
                printFrame.style.right = "0";
                printFrame.style.bottom = "0";
                printFrame.style.width = "0";
                printFrame.style.height = "0";
                printFrame.style.border = "0";
                printFrame.src = url;

                printFrame.onload = () => {
                  printFrame.contentWindow.focus();
                  printFrame.contentWindow.print();
                  setTimeout(() => document.body.removeChild(printFrame), 1000);
                };

                document.body.appendChild(printFrame);
              } else {
                const printWindow = window.open(url, "_blank");
                if (printWindow) {
                  printWindow.onload = () => {
                    printWindow.print();
                  };
                }
              }
            }}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
            title="Print"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="w-full h-full pt-14 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && (
          <div className="max-w-full max-h-full p-8 flex items-center justify-center">
            <img
              src={url}
              alt={filename}
              className="max-h-[calc(100vh-120px)] max-w-[calc(100vw-64px)] object-contain rounded-lg shadow-2xl"
              style={{ imageRendering: "-webkit-optimize-contrast" }}
            />
          </div>
        )}

        {isPdf && (
          <div className="w-full h-full p-4">
            <iframe
              src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
              title={filename}
              className="w-full h-[calc(100vh-100px)] rounded-lg shadow-2xl bg-white"
            />
          </div>
        )}

        {isVideo && (
          <div className="max-w-5xl w-full p-8">
            <video
              src={url}
              controls
              className="w-full rounded-lg shadow-2xl bg-black"
              style={{ maxHeight: "calc(100vh - 120px)" }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {isText && (
          <div className="w-full h-full p-4 max-w-4xl">
            <iframe
              src={url}
              title={filename}
              className="w-full h-[calc(100vh-100px)] bg-white rounded-lg shadow-2xl"
            />
          </div>
        )}

        {!isImage && !isPdf && !isText && !isVideo && (
          <div className="flex flex-col items-center justify-center text-center text-white p-8">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md border border-slate-700">
              <div className="flex justify-center mb-4">
                <svg
                  className="w-20 h-20 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Cannot preview file
              </h3>
              <p className="text-slate-300 mb-6">
                <strong className="text-white">{filename}</strong> cannot be
                previewed in the browser.
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href={url}
                  download={filename}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download</span>
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const printWindow = window.open(url, "_blank");
                    if (printWindow) {
                      printWindow.onload = () => {
                        printWindow.print();
                      };
                    }
                  }}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center space-x-2 font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute bottom-4 right-4 text-slate-400 text-sm bg-slate-800/80 px-3 py-2 rounded-lg backdrop-blur-sm">
        Press{" "}
        <kbd className="px-2 py-1 bg-slate-700 rounded text-xs ml-1">Esc</kbd>{" "}
        to close
      </div>
    </div>
  );
};

export default PreviewModal;
