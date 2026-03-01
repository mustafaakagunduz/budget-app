import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resetAllUserData } from '../lib/database';
import GenericModal from '../components/GenericModal';

const Settings = ({ theme }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleReset = async () => {
    if (!user?.id) return;
    setIsResetting(true);
    setErrorMessage('');

    const { error } = await resetAllUserData(user.id);

    setIsResetting(false);
    setIsModalOpen(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setSuccessMessage(t('resetSuccess'));
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className={`text-2xl font-bold mb-8 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {t('settings')}
        </h1>

        {successMessage && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Danger Zone */}
        <div className={`rounded-xl border ${
          theme === 'dark' ? 'border-red-500/30 bg-red-500/5' : 'border-red-300 bg-red-50'
        }`}>
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${
            theme === 'dark' ? 'border-red-500/30' : 'border-red-300'
          }`}>
            <AlertTriangle size={16} className={theme === 'dark' ? 'text-red-400' : 'text-red-600'} />
            <h2 className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>
              {t('dangerZone')}
            </h2>
          </div>

          <div className="px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('resetAllData')}
              </p>
              <p className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
              }`}>
                {t('resetAllDataDesc')}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : 'bg-red-50 text-red-600 border border-red-300 hover:bg-red-100'
              }`}
            >
              {t('resetAllData')}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <GenericModal
        isOpen={isModalOpen}
        onClose={() => !isResetting && setIsModalOpen(false)}
        title={t('resetAllData')}
        theme={theme}
      >
        <p className={`text-sm mb-6 ${
          theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
        }`}>
          {t('resetAllDataDesc')}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setIsModalOpen(false)}
            disabled={isResetting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'text-zinc-300 hover:bg-zinc-700 disabled:opacity-50'
                : 'text-gray-700 hover:bg-gray-100 disabled:opacity-50'
            }`}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50'
                : 'bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 disabled:opacity-50'
            }`}
          >
            {isResetting ? '...' : t('resetConfirm')}
          </button>
        </div>
      </GenericModal>
    </div>
  );
};

export default Settings;
