import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({
  pagination,
  currentPage,
  perPage,
  onPageChange,
  onPerPageChange,
  isReaderOpen = false, // Tambah prop untuk deteksi apakah EmailReader terbuka
}) {
  const { total, total_pages, from, to } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(total_pages);
      } else if (currentPage >= total_pages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = total_pages - 3; i <= total_pages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(total_pages);
      }
    }
    return pages;
  };

  const handlePrevious = () => currentPage > 1 && onPageChange(currentPage - 1);
  const handleNext = () =>
    currentPage < total_pages && onPageChange(currentPage + 1);
  const handlePageClick = (page) =>
    typeof page === "number" && page !== currentPage && onPageChange(page);

  return (
    <div
      className="px-4 sm:px-6 py-3 sm:py-[15.2px] flex flex-col sm:flex-row items-center justify-between 
      space-y-3 sm:space-y-0 border-t border-slate-200 dark:border-slate-800 
      bg-slate-50 dark:bg-[rgb(10,16,35)] transition-colors duration-300 select-none"
    >
      {/* Info: Hilangkan jika isReaderOpen true */}
      {!isReaderOpen && (
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Showing{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {from}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {to}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {total}
          </span>{" "}
          results
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
        {" "}
        {/* Per Page Selector */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <label
            htmlFor="perPage"
            className="text-xs sm:text-xs text-slate-600 dark:text-slate-400 font-medium"
          >
            Per page:
          </label>
          <select
            id="perPage"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-white dark:bg-[rgb(10,16,35)] border border-slate-200 dark:border-slate-800 
              text-slate-700 dark:text-slate-300 text-xs sm:text-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 
              transition-all duration-200 active:scale-95"
          >
            {[10, 20, 50, 100].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        {/* Page Navigation */}
        <div className="flex items-center space-x-1">
          {/* Previous */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white dark:bg-[rgb(10,16,35)] border border-slate-200 dark:border-slate-800 
              text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 
              transition-transform duration-150 active:scale-90"
          >
            <ChevronLeft className="w-3 sm:w-4 h-3 sm:h-3" />
            <span className="hidden sm:inline text-xs sm:text-sm">
              Previous
            </span>
          </button>

          {/* Page Numbers */}
          <div className="hidden md:flex items-center space-x-1">
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span
                  key={i}
                  className="px-2 sm:px-3 py-1 text-slate-500 dark:text-slate-400 select-none text-xs sm:text-xs"
                >
                  ...
                </span>
              ) : (
                <button
                  key={i}
                  onClick={() => handlePageClick(page)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 
                    active:scale-90 transform-gpu
                    ${
                      currentPage === page
                        ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                        : "bg-white dark:bg-[rgb(10,16,35)] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          {/* Mobile Info */}
          <div className="md:hidden text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-2 sm:px-3 py-1">
            Page{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {total_pages}
            </span>
          </div>

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={currentPage === total_pages}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white dark:bg-[rgb(10,16,35)] border border-slate-200 dark:border-slate-800 
              text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 
              transition-transform duration-150 active:scale-90"
          >
            <span className="hidden sm:inline text-xs sm:text-sm">Next</span>
            <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pagination;
