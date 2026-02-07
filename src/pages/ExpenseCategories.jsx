import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCategories, addCategory, subscribeToCategories, unsubscribe } from '../lib/database';
import GenericModal from '../components/GenericModal';

// Color palette
const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' }
];

const ExpenseCategories = ({ theme }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load categories from database
  useEffect(() => {
    if (user?.id) {
      loadCategories();
    }
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToCategories(user.id, () => {
      // Kategoriler değiştiğinde yeniden yükle
      loadCategories();
    });

    return () => {
      unsubscribe(subscription);
    };
  }, [user?.id]);

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await getUserCategories(user.id);

    if (error) {
      setError('Kategoriler yüklenemedi');
      console.error(error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const openModal = () => {
    setCategoryName('');
    setSelectedColor(COLORS[0].value);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryName('');
    setSelectedColor(COLORS[0].value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!categoryName.trim()) {
      setError('Kategori adı gerekli');
      return;
    }

    // Aynı isimde kategori var mı kontrol et
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.trim().toLowerCase())) {
      setError('Bu kategori zaten mevcut');
      return;
    }

    const { data, error } = await addCategory(user.id, categoryName.trim(), selectedColor);

    if (error) {
      setError('Kategori eklenemedi');
      console.error(error);
    } else {
      closeModal();
      // Realtime subscription otomatik güncelleyecek
      // Ama fallback olarak manuel yeniden yükle
      await loadCategories();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pb-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-20 px-4 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {t('expenseCategories')}
        </h1>
        <button
          onClick={openModal}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
            theme === 'dark'
              ? 'bg-cyan-400 text-zinc-900 hover:bg-cyan-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Henüz kategori yok
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="py-3 px-4 rounded-lg flex items-center gap-3"
            >
              <div
                className="w-1.5 h-10 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1">
                <span className={`text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {category.name}
                </span>
                {category.is_default && (
                  <span className={`ml-2 text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    (Varsayılan)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <GenericModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={t('addCategory')}
        theme={theme}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              {t('categoryName')}
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
              autoFocus
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              {t('color')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedColor === color.value
                      ? 'ring-2 ring-offset-2 ring-cyan-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-cyan-400 text-zinc-900 hover:bg-cyan-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {t('add')}
            </button>
          </div>
        </form>
      </GenericModal>
    </div>
  );
};

export default ExpenseCategories;
