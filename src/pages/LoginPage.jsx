import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Facebook,
  Instagram,
  Twitter,
  ArrowLeft,
  Check,
  Mailbox,
} from "lucide-react";
import { login } from "../services/api.js";

/**
 * Halaman Login utama aplikasi Webmail Client.
 * Menyediakan fitur:
 * - Autentikasi user (login)
 * - Validasi input email & password
 * - Menampilkan loading state dan error
 * - Pergantian tampilan antara login dan forgot password
 *
 * @component
 */
const LoginPage = () => {
  // === State Management ===
  const [email, setEmail] = useState(""); // input email user
  const [password, setPassword] = useState(""); // input password user
  const [showPassword, setShowPassword] = useState(false); // toggle visibilitas password
  const [rememberMe, setRememberMe] = useState(false); // checkbox Remember Me
  const [currentView, setCurrentView] = useState("login"); // tampilan aktif: "login" atau "forgot"
  const [resetEmailSent, setResetEmailSent] = useState(false); // notifikasi reset password
  const [errorMessage, setErrorMessage] = useState(""); // pesan error untuk validasi atau gagal login
  const [loading, setLoading] = useState(false); // status loading saat login

  const navigate = useNavigate();

  /**
   * Fungsi untuk menangani proses login.
   * Melakukan validasi input sebelum memanggil API login.
   * Jika berhasil, redirect ke halaman Inbox.
   */
  const handleSubmit = async () => {
    setErrorMessage("");
    setLoading(true); // mulai loading spinner

    // Validasi form dasar
    if (!email) {
      setErrorMessage("Email cannot be empty.");
      setLoading(false);
      return;
    }
    if (!email.includes("@")) {
      setErrorMessage("Invalid email format.");
      setLoading(false);
      return;
    }
    if (!password) {
      setErrorMessage("Password cannot be empty.");
      setLoading(false);
      return;
    }

    // Eksekusi login ke API
    try {
      const data = await login(email, password);
      navigate("/mail/inbox"); // redirect ke inbox setelah sukses
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false); // hentikan loading
    }
  };

  /**
   * Fungsi untuk menangani permintaan lupa password (Forgot Password).
   * Saat ini hanya menampilkan notifikasi simulasi reset password.
   */
  const handleForgotPassword = () => {
    if (!email) {
      alert("Please enter your email address first");
      return;
    }

    console.log("Password reset for:", email);
    setResetEmailSent(true);

    // Kembalikan ke tampilan login setelah 3 detik
    setTimeout(() => {
      setResetEmailSent(false);
      setCurrentView("login");
    }, 3000);
  };

  return (
    <>
      {/* === Layout utama halaman login === */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* === Bagian Kiri: Welcome Section === */}
          <div className="flex-1 text-white text-center lg:text-left lg:pr-12 order-1 lg:order-1">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 lg:mb-6 leading-tight">
                Welcome
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500">
                  Back
                </span>
              </h1>
              <p className="text-slate-200 text-base lg:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 hidden lg:block">
                Manage your email campaigns with ease. Our platform provides
                powerful tools for creating, sending, and tracking your email
                marketing success.
              </p>
            </div>

            {/* === Ikon Sosial Media (dummy interaktif) === */}
            <div className="hidden lg:flex space-x-4 justify-center lg:justify-start">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  rel="noopener noreferrer"
                  className="w-10 h-10 lg:w-12 lg:h-12 bg-white bg-opacity-10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-20 transition-all duration-300 cursor-pointer group"
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* === Bagian Kanan: Login / Forgot Password Form === */}
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-96 order-2 lg:order-2">
            <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl">
              {/* Header form */}
              <div className="mb-6 lg:mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Mailbox className="w-6 h-6 lg:w-8 lg:h-8 text-slate-800 mr-2" />
                  <h2 className="text-xl sm:text-2xl font-bold italic bg-gradient-to-r from-slate-800 via-slate-500 to-indigo-900 bg-clip-text text-transparent">
                    FLOWSENT
                  </h2>
                </div>

                {/* Dynamic title berdasarkan view aktif */}
                {currentView === "login" && (
                  <p className="text-sm sm:text-base text-gray-600">
                    Sign in to your account to continue
                  </p>
                )}
                {currentView === "forgot" && (
                  <>
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
                      Reset Password
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Enter your email to receive reset instructions
                    </p>
                  </>
                )}
              </div>

              {/* Notifikasi sukses reset password */}
              {resetEmailSent && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center text-sm">
                  <Check className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>Password reset email sent! Check your inbox.</span>
                </div>
              )}

              {/* === Form Login === */}
              {currentView === "login" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Pesan error validasi */}
                  {errorMessage && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                      {errorMessage}
                    </div>
                  )}

                  {/* Input email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 bg-white text-sm sm:text-base"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Input password + toggle visibility */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 bg-white text-sm sm:text-base"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox "Remember me" & tombol lupa password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-slate-600 bg-gray-100 border-gray-300 rounded focus:ring-slate-500 focus:ring-2"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">
                        Remember Me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentView("forgot")}
                      className="text-xs sm:text-sm text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Tombol login */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 
                    ${
                      loading
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transform hover:scale-105"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
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
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        Signing In...
                      </>
                    ) : (
                      "Sign In Now"
                    )}
                  </button>
                </form>
              )}

              {/* === Tampilan Forgot Password === */}
              {currentView === "forgot" && (
                <div className="space-y-4 sm:space-y-6">
                  <button
                    onClick={() => setCurrentView("login")}
                    className="flex items-center text-slate-600 hover:text-slate-800 transition-colors mb-4 text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </button>

                  {/* Input email untuk reset password */}
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        id="reset-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 bg-white text-sm sm:text-base"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Tombol kirim reset password */}
                  <button
                    onClick={handleForgotPassword}
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:from-slate-700 hover:to-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                  >
                    Send Reset Email
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
