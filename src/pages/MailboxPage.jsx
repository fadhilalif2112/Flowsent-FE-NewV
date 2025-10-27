// src/pages/MailboxPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, RefreshCw, PanelLeft, PanelRight } from "lucide-react";
import Sidebar from "../components/Sidebar";
import EmailList from "../components/EmailList";
import EmailReader from "../components/EmailReader";
import ComposeModal from "../components/ComposeModal";
import UserDropdown from "../components/UserDropdown";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useEmail } from "../contexts/EmailContext";

function MailboxPage() {
  const { folder = "inbox", messageId } = useParams();
  const navigate = useNavigate();

  const {
    emails,
    allEmails,
    pagination,
    currentPage,
    perPage,
    fetchEmail,
    refreshEmail,
    setCurrentPage,
    setPerPage,
    setSelectedEmailIds,
    isAnyActionLoading, // [CHANGE] Added
    setActionLoading, // [CHANGE] Added
  } = useEmail();

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState("new");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchEmail(folder, currentPage, perPage, true);
  }, []);

  useEffect(() => {
    if (allEmails.length > 0) {
      fetchEmail(folder, currentPage, perPage);
    }
  }, [folder, currentPage, perPage, allEmails]);

  useEffect(() => {
    if (messageId && emails.length > 0) {
      const email = emails.find((e) => e.messageId === messageId);
      if (email) {
        setSelectedEmail(email);
        if (folder === "draft") {
          handleCompose("edit-draft", email);
          setReaderOpen(false);
        } else {
          setReaderOpen(true);
        }
      }
    } else {
      setSelectedEmail(null);
      setReaderOpen(false);
      setShowCompose(false);
    }
  }, [messageId, emails, folder]);

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    if (folder === "draft") {
      handleCompose("edit-draft", email);
      navigate(`/mail/${folder}/${email.messageId}`);
    } else {
      setReaderOpen(true);
      navigate(`/mail/${folder}/${email.messageId}`);
    }
  };

  const handleCloseReader = () => {
    setSelectedEmail(null);
    setReaderOpen(false);
    navigate(`/mail/${folder}`);
  };

  const handleCompose = (mode = "new", email = null) => {
    setComposeMode(mode);
    setSelectedEmail(email);
    setShowCompose(true);
    setReaderOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setActionLoading(true); // [CHANGE] Set global loading
    try {
      await refreshEmail(folder);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
      setActionLoading(false); // [CHANGE] Reset global loading
    }
  };

  const handlePageChange = (newPage) => setCurrentPage(newPage);
  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleFolderChange = (newFolder) => {
    navigate(`/mail/${newFolder}`);
    setCurrentPage(1);
    setSelectedEmail(null);
    setReaderOpen(false);
    setSelectedEmailIds([]);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="lg:hidden text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800 p-2 rounded-lg transition"
            aria-label="Toggle sidebar (mobile)"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="hidden lg:flex text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800 p-2 rounded-lg transition"
            aria-label="Collapse sidebar (desktop)"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelRight className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center space-x-1">
            <div className="rounded-lg">
              <img src="/logo.png" alt="logo" className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-white italic">
              FlowSent
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isAnyActionLoading} // [CHANGE] Added isAnyActionLoading
            className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white p-2 rounded-lg transition disabled:opacity-50"
            aria-label="Refresh"
          >
            {isRefreshing ? (
              <LoadingSpinner message="Refreshing..." />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
          <UserDropdown />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:relative lg:translate-x-0 z-30 transition-transform duration-300 ease-in-out h-full flex-shrink-0`}
        >
          <Sidebar
            currentFolder={folder}
            onFolderChange={handleFolderChange}
            onCompose={() => handleCompose("new")}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          />
        </div>
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-[73px] bg-black/35 dark:bg-black/45 backdrop-blur-[1.5px] z-20 lg:hidden transition-all"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`flex flex-col flex-1 overflow-hidden ${
            readerOpen ? "hidden lg:flex lg:flex-none lg:w-96" : "flex"
          }`}
        >
          <EmailList
            folder={folder}
            selectedEmail={selectedEmail}
            onSelectEmail={handleSelectEmail}
            isReaderOpen={readerOpen}
          />
          {pagination && pagination.total > 0 && (
            <Pagination
              pagination={pagination}
              currentPage={currentPage}
              perPage={perPage}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              isReaderOpen={readerOpen}
            />
          )}
        </div>
        {readerOpen && selectedEmail && (
          <div className="fixed lg:relative inset-0 lg:inset-auto z-20 lg:z-0 w-full lg:flex-1 flex flex-col bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
            <EmailReader
              email={selectedEmail}
              onClose={handleCloseReader}
              onReply={() => handleCompose("reply", selectedEmail)}
              onForward={() => handleCompose("forward", selectedEmail)}
              currentFolder={folder}
            />
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeModal
          mode={composeMode}
          originalEmail={selectedEmail}
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            refreshEmail(folder);
          }}
        />
      )}
    </div>
  );
}

export default MailboxPage;
