import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Budget from './pages/Budget';
import Investments from './pages/Investments';
import PaymentMethods from './pages/PaymentMethods';
import Ibans from './pages/Ibans';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function AppContent({ theme, setTheme, currency, setCurrency, sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  // Public auth pages where menu button should be hidden
  const authPages = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];
  const showMenuButton = !authPages.includes(location.pathname);

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        setTheme={setTheme}
        currency={currency}
        setCurrency={setCurrency}
      />

      {/* Menu Button - Only show on protected pages */}
      {showMenuButton && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`fixed top-4 left-4 z-30 transition-colors ${
            theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          <Menu size={28} />
        </button>
      )}

      <Routes>
          {/* Public Routes - Auth Pages */}
          <Route path="/login" element={<Login theme={theme} />} />
          <Route path="/signup" element={<Signup theme={theme} />} />
          <Route path="/verify-email" element={<VerifyEmail theme={theme} />} />
          <Route path="/forgot-password" element={<ForgotPassword theme={theme} />} />
          <Route path="/reset-password" element={<ResetPassword theme={theme} />} />

          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home theme={theme} currency={currency} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <Budget theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investments"
            element={
              <ProtectedRoute>
                <Investments theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-methods"
            element={
              <ProtectedRoute>
                <PaymentMethods theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ibans"
            element={
              <ProtectedRoute>
                <Ibans theme={theme} />
              </ProtectedRoute>
            }
          />
      </Routes>
      <BottomNav theme={theme} />
    </>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'TRY');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div
          className={`min-h-screen flex flex-col relative overflow-hidden ${
            theme === 'dark' ? 'bg-zinc-950' : 'bg-stone-50'
          }`}
          style={{
            backgroundImage: theme === 'dark'
              ? `
                radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
                linear-gradient(180deg, rgba(6, 182, 212, 0.02) 0%, transparent 100%),
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.03) 2px, rgba(6, 182, 212, 0.03) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(59, 130, 246, 0.02) 2px, rgba(59, 130, 246, 0.02) 4px)
              `
              : `
                radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.06) 0%, transparent 35%),
                radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 35%),
                radial-gradient(circle at 50% 10%, rgba(147, 197, 253, 0.04) 0%, transparent 40%),
                linear-gradient(180deg, rgba(191, 219, 254, 0.2) 0%, transparent 100%),
                repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(59, 130, 246, 0.02) 3px, rgba(59, 130, 246, 0.02) 6px),
                repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(99, 102, 241, 0.02) 3px, rgba(99, 102, 241, 0.02) 6px)
              `
          }}
        >
          <AppContent
            theme={theme}
            setTheme={setTheme}
            currency={currency}
            setCurrency={setCurrency}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
