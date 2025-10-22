// src/components/Sidebar.jsx
import React from "react";
import {
  Inbox,
  FileText,
  Send,
  Star,
  Archive,
  AlertOctagon,
  Trash2,
  Plus,
} from "lucide-react";
import { getFolderCounts, getUnreadCounts } from "../data/dummyEmails";

function Sidebar({ currentFolder, onFolderChange, onCompose, collapsed }) {
  const folderCounts = getFolderCounts();
  const unreadCounts = getUnreadCounts();

  const folders = [
    {
      id: "inbox",
      name: "Inbox",
      icon: Inbox,
      count: folderCounts.inbox || 0,
      unread: unreadCounts.inbox || 0,
    },
    {
      id: "draft",
      name: "Drafts",
      icon: FileText,
      count: folderCounts.draft || 0,
    },
    { id: "sent", name: "Sent", icon: Send, count: folderCounts.sent || 0 },
    {
      id: "starred",
      name: "Starred",
      icon: Star,
      count: folderCounts.starred || 0,
    },
    {
      id: "archive",
      name: "Archive",
      icon: Archive,
      count: folderCounts.archive || 0,
    },
    {
      id: "junk",
      name: "Junk",
      icon: AlertOctagon,
      count: folderCounts.junk || 0,
    },
    {
      id: "deleted",
      name: "Deleted",
      icon: Trash2,
      count: folderCounts.deleted || 0,
    },
  ];

  return (
    <aside
      className={`flex flex-col h-full border-r border-slate-200 dark:border-slate-800 
        bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 ease-in-out
        ${collapsed ? "w-[4.5rem]" : "w-64"}`}
    >
      {/* Compose Button */}
      <div className="p-4 flex justify-center">
        {!collapsed ? (
          <button
            onClick={onCompose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 
            text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition duration-200 
            shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <Plus className="w-5 h-5" />
            <span>New Message</span>
          </button>
        ) : (
          <button
            onClick={onCompose}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600
            text-white p-3 rounded-xl transition duration-200 shadow-sm hover:shadow-md"
            title="New Message"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Folders Section */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {!collapsed && (
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2 mb-1">
            Folders
          </div>
        )}

        {folders.map((folder) => {
          const Icon = folder.icon;
          const isActive = currentFolder === folder.id;

          return (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={`w-full flex items-center ${
                collapsed ? "justify-center" : "justify-between"
              } px-3 py-2.5 rounded-lg transition duration-150 group
                ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              title={collapsed ? folder.name : ""}
            >
              <div
                className={`flex items-center ${
                  collapsed ? "justify-center" : "space-x-3"
                } min-w-0`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  }`}
                />
                {!collapsed && <span className="truncate">{folder.name}</span>}
              </div>

              {!collapsed &&
                (folder.unread > 0 ? (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isActive
                        ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                        : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    }`}
                  >
                    {folder.unread}
                  </span>
                ) : folder.count > 0 ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {folder.count}
                  </span>
                ) : null)}
            </button>
          );
        })}
      </nav>

      {/* Storage Info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Storage</span>
              <span>2.4 GB of 15 GB</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: "16%" }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
