// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EmailProvider } from "./contexts/EmailContext";
import LoginPage from "./pages/LoginPage";
import MailboxPage from "./pages/MailboxPage";

function App() {
  const isAuthenticated = () => !!localStorage.getItem("authToken");

  const PrivateRoute = ({ children }) =>
    isAuthenticated() ? children : <Navigate to="/login" replace />;

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/mail/:folder"
          element={
            <PrivateRoute>
              <EmailProvider>
                <MailboxPage />
              </EmailProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/mail/:folder/:messageId"
          element={
            <PrivateRoute>
              <EmailProvider>
                <MailboxPage />
              </EmailProvider>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/mail/inbox" replace />} />
        {/* Optional: 404 */}
        <Route path="*" element={<Navigate to="/mail/inbox" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
