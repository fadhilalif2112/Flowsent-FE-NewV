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
import { useEmail } from "../contexts/EmailContext";

function MailboxPage() {
  const { folder = "inbox", messageId } = useParams();
  const navigate = useNavigate();

  // === ambil state & function dari EmailContext ===
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
  } = useEmail();

  // === local UI state ===
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState("new");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);

  // === Load emails sekali saat halaman dimuat ===
  useEffect(() => {
    fetchEmail(folder, currentPage, perPage, true);
  }, []);

  // === Update tampilan saat folder, page, atau data berubah ===
  useEffect(() => {
    if (allEmails.length > 0) {
      fetchEmail(folder, currentPage, perPage);
    }
  }, [folder, currentPage, perPage, allEmails]);

  // === buka email berdasarkan URL param (messageId) ===
  useEffect(() => {
    if (messageId && emails.length > 0) {
      const email = emails.find((e) => e.messageId === messageId);
      if (email) {
        setSelectedEmail(email);
        if (folder === "draft") {
          // Buka compose untuk edit draft
          handleCompose("edit-draft", email);
          setReaderOpen(false); // Pastikan reader tidak open
        } else {
          setReaderOpen(true);
        }
      }
    } else {
      setSelectedEmail(null);
      setReaderOpen(false);
      setShowCompose(false); // Tutup compose jika tidak ada messageId
    }
  }, [messageId, emails, folder]); // Tambahkan folder sebagai dependency

  // === handler email list ===
  const handleSelectEmail = (email) => {
    setSelectedEmail(email); // Set dulu untuk semua kasus
    if (folder === "draft") {
      // buka compose modal dengan isi draft
      handleCompose("edit-draft", email);
      navigate(`/mail/${folder}/${email.messageId}`); // Update URL
    } else {
      // default: buka email reader
      setReaderOpen(true);
      navigate(`/mail/${folder}/${email.messageId}`);
    }
  };

  const handleCloseReader = () => {
    setSelectedEmail(null);
    setReaderOpen(false);
    navigate(`/mail/${folder}`);
  };

  // === compose ===
  const handleCompose = (mode = "new", email = null) => {
    setComposeMode(mode);
    setSelectedEmail(email); // simpan email yang diedit
    setShowCompose(true);
    setReaderOpen(false); // pastikan reader tertutup kalau ada
  };

  // === refresh & actions ===
  const handleRefresh = () => refreshEmail(folder);

  // === pagination ===
  const handlePageChange = (newPage) => setCurrentPage(newPage);
  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  // === folder change ===
  const handleFolderChange = (newFolder) => {
    navigate(`/mail/${newFolder}`);
    setCurrentPage(1);
    setSelectedEmail(null);
    setReaderOpen(false);
    setSelectedEmailIds([]);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center space-x-3">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="lg:hidden text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800 p-2 rounded-lg transition"
            aria-label="Toggle sidebar (mobile)"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
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

          {/* Logo */}
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
            className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white p-2 rounded-lg transition"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <UserDropdown />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
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

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-[73px] bg-black/35 dark:bg-black/45 backdrop-blur-[1.5px] z-20 lg:hidden transition-all"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Email List + Pagination */}
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

        {/* Email Reader */}
        {readerOpen && selectedEmail && (
          <div className="fixed lg:relative inset-0 lg:inset-auto z-20 lg:z-0 w-full lg:flex-1 flex flex-col bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
            <EmailReader
              email={selectedEmail}
              onClose={handleCloseReader}
              onReply={() => handleCompose("reply", selectedEmail)}
              onReplyAll={() => handleCompose("reply-all", selectedEmail)}
              onForward={() => handleCompose("forward", selectedEmail)}
              currentFolder={folder}
            />
          </div>
        )}
      </div>

      {/* Compose Modal */}
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
