import { useState } from 'react';
import { X, Sun, Moon, ChevronDown, Home, ArrowUpDown, TrendingUp, Tags, LogOut, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose, theme, setTheme, currency, setCurrency }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onClose();
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getActiveColor = () => {
    return theme === 'dark' ? 'bg-cyan-400 text-zinc-900' : 'bg-blue-600 text-white';
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 transform transition-transform duration-300 z-50 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${theme === 'dark' ? 'bg-zinc-950' : 'bg-stone-50'}`}
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
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t('menu')}
            </h2>
            <button
              onClick={onClose}
              className={`transition-colors ${
                theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="space-y-2 mb-6">
              <button
                onClick={() => handleNavigate('/home')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home size={20} />
                {t('home')}
              </button>
              <button
                onClick={() => handleNavigate('/budget')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowUpDown size={20} />
                {t('incomeExpense')}
              </button>
              <button
                onClick={() => handleNavigate('/investments')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <TrendingUp size={20} />
                {t('investment')}
              </button>
              <button
                onClick={() => handleNavigate('/payment-methods')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Tags size={20} />
                {t('paymentMethods')}
              </button>
              <button
                onClick={() => handleNavigate('/ibans')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CreditCard size={20} />
                {t('ibanInfo')}
              </button>
            </nav>

            {/* Saved IBANs Section */}
            <div className={`mb-6 px-4 py-2 ${
              theme === 'dark' ? 'text-zinc-500 text-xs' : 'text-gray-400 text-xs'
            }`}>
              {t('savedIbans')}
            </div>

            {/* Language Selector - Collapsible */}
            <div className="mb-6">
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                }`}
              >
                <h3 className={`text-sm font-semibold ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                }`}>{t('language')}</h3>
                <ChevronDown
                  size={18}
                  className={`transition-transform ${languageOpen ? 'rotate-180' : ''} ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                  }`}
                />
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${
                languageOpen ? 'max-h-24 mt-2' : 'max-h-0'
              }`}>
                <div className="space-y-1">
                  <button
                    onClick={() => changeLanguage('tr')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      i18n.language === 'tr'
                        ? getActiveColor()
                        : theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('turkish')}
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      i18n.language === 'en'
                        ? getActiveColor()
                        : theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('english')}
                  </button>
                </div>
              </div>
            </div>

            {/* Currency Selector - Collapsible */}
            <div className="mb-6">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                }`}
              >
                <h3 className={`text-sm font-semibold ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                }`}>{t('currency')}</h3>
                <ChevronDown
                  size={18}
                  className={`transition-transform ${currencyOpen ? 'rotate-180' : ''} ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                  }`}
                />
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${
                currencyOpen ? 'max-h-24 mt-2' : 'max-h-0'
              }`}>
                <div className="space-y-1">
                  <button
                    onClick={() => setCurrency('TRY')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      currency === 'TRY'
                        ? getActiveColor()
                        : theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('turkishLira')}
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      currency === 'USD'
                        ? getActiveColor()
                        : theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('usDollar')}
                  </button>
                </div>
              </div>
            </div>

            {/* Theme Selector - Collapsible */}
            <div>
              <button
                onClick={() => setThemeOpen(!themeOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                }`}
              >
                <h3 className={`text-sm font-semibold ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                }`}>{t('theme')}</h3>
                <ChevronDown
                  size={18}
                  className={`transition-transform ${themeOpen ? 'rotate-180' : ''} ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                  }`}
                />
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${
                themeOpen ? 'max-h-24 mt-2' : 'max-h-0'
              }`}>
                <div className="space-y-1">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      theme === 'dark'
                        ? getActiveColor()
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Moon size={18} />
                    {t('darkMode')}
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      theme === 'light'
                        ? getActiveColor()
                        : theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Sun size={18} />
                    {t('lightMode')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button - Bottom */}
          {user && (
            <div className={`p-4 border-t ${
              theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-red-400 hover:bg-red-500/10 border border-red-500/20'
                    : 'text-red-600 hover:bg-red-50 border border-red-200'
                }`}
              >
                <LogOut size={20} />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
