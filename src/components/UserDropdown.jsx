import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Moon, Sun, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { logout } from "../services/api";

function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({ email: "user@example.com", name: "User" });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Ambil data pengguna dari sessionStorage saat komponen dimuat
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          email: parsedUser.email || "user@example.com",
          name: parsedUser.name || "User",
        });
      } catch (error) {
        console.error("Error parsing user data from sessionStorage:", error);
      }
    }
  }, []);

  // Tangani klik di luar dropdown untuk menutup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Panggil fungsi logout dari services/api.js
      const response = await logout();
      console.log(response.message); // Log pesan dari server atau lokal
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Hapus semua data di sessionStorage
      sessionStorage.clear();
      // Alihkan ke halaman login
      navigate("/login");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* === Trigger Button === */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline text-sm font-medium">
          {user.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* === Dropdown Menu === */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 py-1">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>

            {/* === Theme Switch === */}
            <div className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center space-x-3">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                ) : (
                  <Sun className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                )}
                <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </div>

              {/* Switch Lamp Toggle */}
              <button
                onClick={toggleTheme}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                  theme === "dark" ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
                    theme === "dark" ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="border-t border-slate-200 dark:border-slate-700 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDropdown;
