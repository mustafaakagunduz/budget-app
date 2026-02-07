import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCategories, addCategory, updateCategory, deleteCategory, subscribeToCategories, unsubscribe } from '../lib/database';
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
  const [editingCategory, setEditingCategory] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, category: null });
  const contextMenuRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, category: null });
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Swipe states
  const [swipedCategory, setSwipedCategory] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchCurrent, setTouchCurrent] = useState(null);

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

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, category: null });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [contextMenu.visible]);

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

  const openModal = (category = null) => {
    setEditingCategory(category);
    setSwipedCategory(null);
    setContextMenu({ visible: false, x: 0, y: 0, category: null });

    if (category) {
      setCategoryName(category.name);
      setSelectedColor(category.color || COLORS[0].value);
    } else {
      setCategoryName('');
      setSelectedColor(COLORS[0].value);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryName('');
    setSelectedColor(COLORS[0].value);
    setError('');
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!categoryName.trim()) {
      setError('Kategori adı gerekli');
      return;
    }

    // Aynı isimde kategori var mı kontrol et
    const normalizedName = categoryName.trim().toLowerCase();
    if (categories.some(cat => cat.id !== editingCategory?.id && cat.name.toLowerCase() === normalizedName)) {
      setError('Bu kategori zaten mevcut');
      return;
    }

    if (editingCategory) {
      const { error } = await updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        color: selectedColor
      });

      if (error) {
        setError('Kategori güncellenemedi');
        console.error(error);
      } else {
        closeModal();
        await loadCategories();
      }
    } else {
      const { error } = await addCategory(user.id, categoryName.trim(), selectedColor);

      if (error) {
        setError('Kategori eklenemedi');
        console.error(error);
      } else {
        closeModal();
        // Realtime subscription otomatik güncelleyecek
        // Ama fallback olarak manuel yeniden yükle
        await loadCategories();
      }
    }
  };

  const openDeleteConfirm = (category) => {
    setContextMenu({ visible: false, x: 0, y: 0, category: null });
    setSwipedCategory(null);
    setDeleteError('');
    setDeleteConfirm({ open: true, category });
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) return;
    setDeleteConfirm({ open: false, category: null });
    setDeleteError('');
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm.category || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    const { error } = await deleteCategory(deleteConfirm.category.id);

    if (error) {
      console.error('Delete category error:', error);
      setDeleteError('Kategori silinemedi');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setDeleteConfirm({ open: false, category: null });
    await loadCategories();
  };

  const handleEditCategory = (category) => {
    setContextMenu({ visible: false, x: 0, y: 0, category: null });
    openModal(category);
  };

  const handleContextMenu = (e, category) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    setContextMenu({ visible: true, x, y, category });
  };

  const handleTouchStart = (e, category) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, category });
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e, category) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });

    const deltaX = touchStart.x - touch.clientX;
    const deltaY = Math.abs(touchStart.y - touch.clientY);

    // Yatay kaydırma yeterince büyükse ve dikey kaydırma küçükse
    if (Math.abs(deltaX) > 20 && deltaY < 30) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e, category) => {
    if (!touchStart || !touchCurrent) return;

    const deltaX = touchStart.x - touchCurrent.x;
    const deltaY = Math.abs(touchStart.y - touchCurrent.y);

    // Sola kaydırma (deltaX > 0) ve dikey hareket küçük
    if (deltaX > 50 && deltaY < 30) {
      setSwipedCategory(category.id);
    }
    // Sağa kaydırma - kapat
    else if (deltaX < -50 && deltaY < 30) {
      setSwipedCategory(null);
    }
    // Küçük hareket - toggle
    else if (Math.abs(deltaX) < 10 && deltaY < 10) {
      if (swipedCategory === category.id) {
        setSwipedCategory(null);
      }
    }

    setTouchStart(null);
    setTouchCurrent(null);
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
          {categories.map((category) => {
            const isSwipedOpen = swipedCategory === category.id;
            const swipeOffset = isSwipedOpen ? -140 : 0;

            return (
              <div
                key={category.id}
                className="relative overflow-hidden rounded-lg"
              >
                {/* Action buttons - behind the row */}
                <div
                  className={`absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2 md:hidden transition-opacity ${
                    isSwipedOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <button
                    onClick={() => handleEditCategory(category)}
                    className={`h-full px-5 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(category)}
                    className={`h-full px-5 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div
                  className={`relative flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-900/40 hover:bg-zinc-800/50 active:bg-zinc-800/70'
                      : 'bg-white/60 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                  style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: touchStart ? 'none' : 'transform 0.3s ease-out',
                    zIndex: 10,
                  }}
                  onContextMenu={(e) => handleContextMenu(e, category)}
                  onTouchStart={(e) => handleTouchStart(e, category)}
                  onTouchMove={(e) => handleTouchMove(e, category)}
                  onTouchEnd={(e) => handleTouchEnd(e, category)}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.category && (
        <div
          ref={contextMenuRef}
          className={`fixed z-50 py-2 rounded-lg shadow-xl border min-w-[160px] ${
            theme === 'dark'
              ? 'bg-zinc-800 border-zinc-700'
              : 'bg-white border-gray-200'
          }`}
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            onClick={() => handleEditCategory(contextMenu.category)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
              theme === 'dark'
                ? 'text-zinc-300 hover:bg-zinc-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Edit2 size={16} />
            <span>Düzenle</span>
          </button>
          <button
            onClick={() => openDeleteConfirm(contextMenu.category)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
              theme === 'dark'
                ? 'text-red-400 hover:bg-zinc-700'
                : 'text-red-600 hover:bg-gray-100'
            }`}
          >
            <Trash2 size={16} />
            <span>Sil</span>
          </button>
        </div>
      )}

      {/* Add Category Modal */}
      <GenericModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Kategoriyi Düzenle' : t('addCategory')}
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
              {editingCategory ? 'Güncelle' : t('add')}
            </button>
          </div>
        </form>
      </GenericModal>

      {/* Delete Confirm Modal */}
      <GenericModal
        isOpen={deleteConfirm.open}
        onClose={closeDeleteConfirm}
        title="Emin misiniz?"
        theme={theme}
      >
        <div className="space-y-4">
          <p className={`${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
            {deleteConfirm.category?.name
              ? `"${deleteConfirm.category.name}" kategorisini silmek istediğinize emin misiniz?`
              : 'Bu kategoriyi silmek istediğinize emin misiniz?'}
          </p>

          {deleteError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-500 text-sm">{deleteError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeDeleteConfirm}
              disabled={isDeleting}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleDeleteCategory}
              disabled={isDeleting}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-red-500 text-white hover:bg-red-400'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>
        </div>
      </GenericModal>
    </div>
  );
};

export default ExpenseCategories;
