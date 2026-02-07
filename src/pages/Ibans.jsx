import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserIbans, addIban, updateIban, deleteIban } from '../lib/database';
import GenericModal from '../components/GenericModal';

const Ibans = ({ theme }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [ibans, setIbans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [ibanNumber, setIbanNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingIban, setEditingIban] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, iban: null });
  const contextMenuRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, iban: null });
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [viewModal, setViewModal] = useState({ open: false, iban: null });

  // Swipe states
  const [swipedIban, setSwipedIban] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchCurrent, setTouchCurrent] = useState(null);

  // Load IBANs from database
  useEffect(() => {
    if (user?.id) {
      loadIbans();
    }
  }, [user?.id]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, iban: null });
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

  const loadIbans = async () => {
    setLoading(true);
    const { data, error } = await getUserIbans(user.id);

    if (error) {
      setError('IBAN\'lar yüklenemedi');
      console.error(error);
    } else {
      setIbans(data || []);
    }
    setLoading(false);
  };

  const openViewModal = (iban) => {
    setViewModal({ open: true, iban });
    setSwipedIban(null);
  };

  const closeViewModal = () => {
    setViewModal({ open: false, iban: null });
  };

  const openModal = (iban = null) => {
    setEditingIban(iban);
    setSwipedIban(null);
    setContextMenu({ visible: false, x: 0, y: 0, iban: null });

    if (iban) {
      setName(iban.name);
      setBank(iban.bank || '');
      setIbanNumber(iban.iban_number);
    } else {
      setName('');
      setBank('');
      setIbanNumber('');
    }

    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setName('');
    setBank('');
    setIbanNumber('');
    setError('');
    setEditingIban(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !bank.trim() || !ibanNumber.trim()) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (editingIban) {
      const { error } = await updateIban(editingIban.id, {
        name: name.trim(),
        bank: bank.trim(),
        iban_number: ibanNumber.trim()
      });

      if (error) {
        setError('IBAN güncellenemedi');
        console.error(error);
      } else {
        closeModal();
        await loadIbans();
      }
    } else {
      const { error } = await addIban(user.id, name.trim(), bank.trim(), ibanNumber.trim());

      if (error) {
        setError('IBAN eklenemedi');
        console.error(error);
      } else {
        closeModal();
        await loadIbans();
      }
    }
  };

  const openDeleteConfirm = (iban) => {
    setContextMenu({ visible: false, x: 0, y: 0, iban: null });
    setSwipedIban(null);
    setDeleteError('');
    setDeleteConfirm({ open: true, iban });
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) return;
    setDeleteConfirm({ open: false, iban: null });
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deleteConfirm.iban || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    const { error } = await deleteIban(deleteConfirm.iban.id);

    if (error) {
      console.error('Delete error:', error);
      setDeleteError('IBAN silinemedi');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setDeleteConfirm({ open: false, iban: null });
    await loadIbans();
  };

  const handleContextMenu = (e, iban) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    setContextMenu({ visible: true, x, y, iban });
  };

  const handleTouchStart = (e, iban) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, iban });
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e, iban) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });

    const deltaX = touchStart.x - touch.clientX;
    const deltaY = Math.abs(touchStart.y - touch.clientY);

    if (Math.abs(deltaX) > 10 && deltaY < 30) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e, iban) => {
    if (!touchStart || !touchCurrent) {
      setTouchStart(null);
      setTouchCurrent(null);
      return;
    }

    const deltaX = touchStart.x - touchCurrent.x;
    const deltaY = Math.abs(touchStart.y - touchCurrent.y);

    if (deltaX > 50 && deltaY < 30) {
      // Swipe left - open actions
      setSwipedIban(iban.id);
      e.preventDefault();
    } else if (deltaX < -50 && deltaY < 30) {
      // Swipe right - close actions
      setSwipedIban(null);
      e.preventDefault();
    } else if (Math.abs(deltaX) < 10 && deltaY < 10) {
      // Tap
      if (swipedIban === iban.id) {
        setSwipedIban(null);
      } else {
        openViewModal(iban);
      }
      e.preventDefault();
    }

    setTouchStart(null);
    setTouchCurrent(null);
  };

  const handleClick = (e, iban) => {
    // Prevent if swipe actions are open
    if (swipedIban === iban.id) {
      setSwipedIban(null);
      return;
    }
    openViewModal(iban);
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="w-full" style={{ marginTop: '60px' }}>
        <div className="flex h-12 items-center justify-center">
          <h1 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            {t('ibanInfo')}
          </h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-4 py-6 pb-24">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <>
            {/* Add Button */}
            <button
              onClick={() => openModal()}
              className={`w-full py-3 mb-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Plus size={20} />
              {t('addIban')}
            </button>

            {/* IBANs List */}
            {ibans.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Henüz IBAN eklenmemiş
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ibans.map((iban) => {
                  const isSwipedOpen = swipedIban === iban.id;
                  const swipeOffset = isSwipedOpen ? -140 : 0;

                  return (
                    <div key={iban.id} className="relative mb-2 overflow-hidden rounded-lg">
                      {/* Action buttons - behind the row */}
                      <div
                        className={`absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2 md:hidden transition-opacity ${
                          isSwipedOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <button
                          onClick={() => openModal(iban)}
                          className={`h-full px-5 rounded-lg font-medium transition-colors ${
                            theme === 'dark'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(iban)}
                          className={`h-full px-5 rounded-lg font-medium transition-colors ${
                            theme === 'dark'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Main row - slides left to reveal actions */}
                      <div
                        className={`relative py-4 px-4 rounded-lg cursor-pointer transition-all ${
                          theme === 'dark'
                            ? 'bg-zinc-900/40 hover:bg-zinc-800/50 active:bg-zinc-800/70'
                            : 'bg-white/60 hover:bg-gray-100 active:bg-gray-200'
                        }`}
                        style={{
                          transform: `translateX(${swipeOffset}px)`,
                          transition: touchStart ? 'none' : 'transform 0.3s ease-out',
                          zIndex: 10,
                        }}
                        onClick={(e) => handleClick(e, iban)}
                        onContextMenu={(e) => handleContextMenu(e, iban)}
                        onTouchStart={(e) => handleTouchStart(e, iban)}
                        onTouchMove={(e) => handleTouchMove(e, iban)}
                        onTouchEnd={(e) => handleTouchEnd(e, iban)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`text-lg font-medium ${
                            theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
                          }`}>
                            {iban.name}
                          </div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                          }`}>
                            {iban.bank}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.iban && (
        <div
          ref={contextMenuRef}
          className={`fixed z-50 py-2 rounded-lg shadow-xl border min-w-40 ${
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
            onClick={() => openModal(contextMenu.iban)}
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
            onClick={() => openDeleteConfirm(contextMenu.iban)}
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

      {/* Add/Edit Modal */}
      <GenericModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingIban ? 'IBAN Düzenle' : t('addIban')}
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
              {t('name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              {t('bank')}
            </label>
            <input
              type="text"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              {t('ibanNumber')}
            </label>
            <input
              type="text"
              value={ibanNumber}
              onChange={(e) => setIbanNumber(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border font-mono ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
            />
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
              {editingIban ? 'Güncelle' : t('add')}
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
            {deleteConfirm.iban?.name
              ? `"${deleteConfirm.iban.name}" IBAN'ını silmek istediğinize emin misiniz?`
              : 'Bu IBAN\'ı silmek istediğinize emin misiniz?'}
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
              onClick={handleDelete}
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

      {/* View IBAN Modal */}
      <GenericModal
        isOpen={viewModal.open}
        onClose={closeViewModal}
        title={viewModal.iban?.name || ''}
        theme={theme}
      >
        {viewModal.iban && (
          <div className="space-y-4">
            {/* Name Row */}
            <div className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-zinc-700'
                : 'bg-white/60 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs font-medium mb-1 ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                  }`}>
                    {t('name')}
                  </div>
                  <div className={`text-base ${
                    theme === 'dark' ? 'text-zinc-200' : 'text-gray-800'
                  }`}>
                    {viewModal.iban.name}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(viewModal.iban.name, 'view-name')}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {copiedField === 'view-name' ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Bank Row */}
            <div className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-zinc-700'
                : 'bg-white/60 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs font-medium mb-1 ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                  }`}>
                    {t('bank')}
                  </div>
                  <div className={`text-base ${
                    theme === 'dark' ? 'text-zinc-200' : 'text-gray-800'
                  }`}>
                    {viewModal.iban.bank}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(viewModal.iban.bank, 'view-bank')}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {copiedField === 'view-bank' ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* IBAN Number Row */}
            <div className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-zinc-700'
                : 'bg-white/60 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className={`text-xs font-medium mb-1 ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                  }`}>
                    {t('ibanNumber')}
                  </div>
                  <div className={`text-base font-mono break-all ${
                    theme === 'dark' ? 'text-zinc-200' : 'text-gray-800'
                  }`}>
                    {viewModal.iban.iban_number}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(viewModal.iban.iban_number, 'view-iban')}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    theme === 'dark'
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {copiedField === 'view-iban' ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeViewModal}
              className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-cyan-400 text-zinc-900 hover:bg-cyan-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Kapat
            </button>
          </div>
        )}
      </GenericModal>
    </div>
  );
};

export default Ibans;
