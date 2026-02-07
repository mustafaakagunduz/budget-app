import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Trash2, Edit2, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions, getUserCategories, addTransaction, updateTransaction, deleteTransaction, subscribeToTransactions, unsubscribe } from '../lib/database';
import GenericModal from '../components/GenericModal';

const Budget = ({ theme }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('income');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, entry: null });
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [groupByPaymentMethod, setGroupByPaymentMethod] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Context menu states
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, entry: null });
  const [editingEntry, setEditingEntry] = useState(null);
  const contextMenuRef = useRef(null);

  // Swipe states
  const [swipedEntry, setSwipedEntry] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchCurrent, setTouchCurrent] = useState(null);

  const tabs = [
    { id: 'income', label: t('income') },
    { id: 'all', label: t('all') },
    { id: 'expense', label: t('expense') }
  ];

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, entry: null });
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

  // Load data from database
  useEffect(() => {
    if (user?.id) {
      loadTransactions();
      loadCategories();
    }
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToTransactions(user.id, () => {
      loadTransactions();
    });

    return () => {
      unsubscribe(subscription);
    };
  }, [user?.id]);

  const loadTransactions = async () => {
    setLoading(true);
    const { data, error } = await getUserTransactions(user.id);

    if (error) {
      setError('İşlemler yüklenemedi');
      console.error(error);
    } else {
      const incomeList = data?.filter(t => t.type === 'income') || [];
      const expenseList = data?.filter(t => t.type === 'expense') || [];
      setIncomes(incomeList);
      setExpenses(expenseList);
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data, error } = await getUserCategories(user.id);

    if (error) {
      console.error('Categories load error:', error);
      setCategories([]);
    } else {
      setCategories(data || []);
    }
  };

  const openModal = (type, entry = null) => {
    setModalType(type);
    setEditingEntry(entry);

    if (entry) {
      // Düzenleme modu
      setFormTitle(entry.title);
      setFormAmount(entry.amount.toString());
      setFormCategory(entry.category || '');
    } else {
      // Yeni ekleme modu
      setFormTitle('');
      setFormAmount('');
      setFormCategory('');
    }

    setError('');

    // Kategorileri yeniden yükle
    loadCategories().then(() => {
      if (type === 'expense' && categories.length > 0 && !entry) {
        setFormCategory(categories[0].name);
      }
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormTitle('');
    setFormAmount('');
    setFormCategory('');
    setError('');
    setEditingEntry(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formTitle.trim() || !formAmount.trim()) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (modalType === 'expense' && !formCategory) {
      setError('Ödeme yöntemi seçin');
      return;
    }

    if (editingEntry) {
      // Düzenleme modu
      const updates = {
        title: formTitle.trim(),
        amount: parseFloat(formAmount),
        category: modalType === 'expense' ? formCategory : null
      };

      const { error } = await updateTransaction(editingEntry.id, updates);

      if (error) {
        setError('İşlem güncellenemedi');
        console.error(error);
      } else {
        closeModal();
        await loadTransactions();
      }
    } else {
      // Yeni ekleme modu
      // GMT+3 timestamp
      const now = new Date();
      const gmt3Offset = 3 * 60 * 60 * 1000;
      const gmt3Time = new Date(now.getTime() + gmt3Offset);

      const { data, error } = await addTransaction(
        user.id,
        modalType,
        formTitle.trim(),
        parseFloat(formAmount),
        modalType === 'expense' ? formCategory : null,
        gmt3Time.toISOString()
      );

      if (error) {
        setError('İşlem eklenemedi');
        console.error(error);
      } else {
        closeModal();
        await loadTransactions();
      }
    }
  };

  const openDeleteConfirm = (entry) => {
    setContextMenu({ visible: false, x: 0, y: 0, entry: null });
    setSwipedEntry(null);
    setDeleteError('');
    setDeleteConfirm({ open: true, entry });
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) return;
    setDeleteConfirm({ open: false, entry: null });
    setDeleteError('');
  };

  const handleDeleteEntry = async () => {
    if (!deleteConfirm.entry || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    const { error } = await deleteTransaction(deleteConfirm.entry.id);

    if (error) {
      console.error('Delete error:', error);
      setDeleteError('İşlem silinemedi');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setDeleteConfirm({ open: false, entry: null });
    await loadTransactions();
  };

  const handleEditEntry = (entry) => {
    setContextMenu({ visible: false, x: 0, y: 0, entry: null });
    openModal(entry.type, entry);
  };

  const handleContextMenu = (e, entry) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    setContextMenu({ visible: true, x, y, entry });
  };

  const handleTouchStart = (e, entry) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, entry });
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e, entry) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });

    const deltaX = touchStart.x - touch.clientX;
    const deltaY = Math.abs(touchStart.y - touch.clientY);

    // Yatay kaydırma yeterince büyükse ve dikey kaydırma küçükse
    if (Math.abs(deltaX) > 10 && deltaY < 30) {
      e.preventDefault(); // Scroll'u engelle
    }
  };

  const handleTouchEnd = (e, entry) => {
    if (!touchStart || !touchCurrent) {
      setTouchStart(null);
      setTouchCurrent(null);
      return;
    }

    const deltaX = touchStart.x - touchCurrent.x;
    const deltaY = Math.abs(touchStart.y - touchCurrent.y);

    // Sola kaydırma (deltaX > 0) ve dikey hareket küçük
    if (deltaX > 50 && deltaY < 30) {
      setSwipedEntry(entry.id);
    }
    // Sağa kaydırma - kapat
    else if (deltaX < -50 && deltaY < 30) {
      setSwipedEntry(null);
    }
    // Küçük hareket - toggle
    else if (Math.abs(deltaX) < 10 && deltaY < 10) {
      if (swipedEntry === entry.id) {
        setSwipedEntry(null);
      }
    }

    setTouchStart(null);
    setTouchCurrent(null);
  };

  const getAllEntries = () => {
    const combined = [
      ...incomes.map(item => ({ ...item, type: 'income' })),
      ...expenses.map(item => ({ ...item, type: 'expense' }))
    ];
    return combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const calculateTotal = (entries) => {
    return entries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
  };

  const calculateNetAmount = () => {
    const totalIncome = calculateTotal(incomes);
    const totalExpense = calculateTotal(expenses);

    if (activeTab === 'income') return totalIncome;
    if (activeTab === 'expense') return totalExpense;
    return totalIncome - totalExpense;
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#d1d5db';
  };

  const calculatePaymentMethodTotals = (expenses) => {
    const totals = {};

    expenses.forEach(expense => {
      const category = expense.category || 'Diğer';
      if (!totals[category]) {
        totals[category] = 0;
      }
      totals[category] += parseFloat(expense.amount);
    });

    return totals;
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const getExpensesByCategory = (expenses, categoryName) => {
    return expenses.filter(expense => (expense.category || 'Diğer') === categoryName);
  };

  const renderEntries = (entries, type) => {
    return entries.map((entry) => {
      const isSwipedOpen = swipedEntry === entry.id;
      const swipeOffset = isSwipedOpen ? -140 : 0;

      return (
        <div
          key={entry.id}
          className="relative mb-2 overflow-hidden rounded-lg"
        >
          {/* Action buttons - behind the row */}
          <div
            className={`absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2 md:hidden transition-opacity ${
              isSwipedOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={() => handleEditEntry(entry)}
              className={`h-full px-5 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => openDeleteConfirm(entry)}
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
            onContextMenu={(e) => handleContextMenu(e, entry)}
            onTouchStart={(e) => handleTouchStart(e, entry)}
            onTouchMove={(e) => handleTouchMove(e, entry)}
            onTouchEnd={(e) => handleTouchEnd(e, entry)}
          >
            <div className="flex-1">
              <div className={`text-lg ${
                theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                {entry.title}
              </div>
              {entry.category && (
                <div className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`}>
                  {entry.category}
                </div>
              )}
            </div>
            <span className={`font-semibold ${
              type === 'income' || entry.type === 'income'
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {parseFloat(entry.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>
      );
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      );
    }

    if (activeTab === 'income') {
      const hasIncomes = incomes.length > 0;

      return (
        <>
          {hasIncomes && (
            <>
              <button
                onClick={() => openModal('income')}
                className={`w-full py-3 mb-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                }`}
              >
                <Plus size={20} />
                {t('addIncome')}
              </button>

              {/* Total Card */}
              <div className={`mb-4 p-4 rounded-xl backdrop-blur-sm border ${
                theme === 'dark'
                  ? 'bg-zinc-900/40 border-zinc-700/50'
                  : 'bg-white/60 border-gray-200/50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                  }`}>
                    Toplam
                  </span>
                  <span className="text-2xl font-bold text-green-500">
                    {calculateNetAmount().toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>
            </>
          )}

          {!hasIncomes ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <button
                onClick={() => openModal('income')}
                className={`flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-zinc-900'
                    : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                }`}
              >
                <Plus size={40} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => openModal('income')}
                className={`text-2xl font-bold transition-colors ${
                  theme === 'dark'
                    ? 'text-cyan-400 hover:text-cyan-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {t('addIncome')}
              </button>
            </div>
          ) : (
            <div>
              {renderEntries(incomes, 'income')}
            </div>
          )}
        </>
      );
    }

    if (activeTab === 'expense') {
      const hasExpenses = expenses.length > 0;

      return (
        <>
          {hasExpenses && (
            <>
              <button
                onClick={() => openModal('expense')}
                className={`w-full py-3 mb-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                <Minus size={20} />
                {t('addExpense')}
              </button>

              {/* Total Card */}
              <div className={`mb-4 p-4 rounded-xl backdrop-blur-sm border ${
                theme === 'dark'
                  ? 'bg-zinc-900/40 border-zinc-700/50'
                  : 'bg-white/60 border-gray-200/50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                  }`}>
                    Toplam
                  </span>
                  <span className="text-2xl font-bold text-red-500">
                    {calculateNetAmount().toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>

              {/* Group by Payment Method Checkbox */}
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-900/40 hover:bg-zinc-800/50'
                  : 'bg-white/60 hover:bg-gray-100'
              }`}
              onClick={() => setGroupByPaymentMethod(!groupByPaymentMethod)}
              >
                <input
                  type="checkbox"
                  checked={groupByPaymentMethod}
                  onChange={(e) => setGroupByPaymentMethod(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded cursor-pointer accent-cyan-500"
                />
                <label className={`text-sm font-medium cursor-pointer select-none ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
                }`}>
                  Ödeme Yöntemine Göre Grupla
                </label>
              </div>
            </>
          )}

          {!hasExpenses ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <button
                onClick={() => openModal('expense')}
                className={`flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-zinc-900'
                    : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                }`}
              >
                <Minus size={40} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => openModal('expense')}
                className={`text-2xl font-bold transition-colors ${
                  theme === 'dark'
                    ? 'text-cyan-400 hover:text-cyan-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {t('addExpense')}
              </button>
            </div>
          ) : (
            <div>
              {groupByPaymentMethod ? (
                // Grouped by payment method - collapsible
                (() => {
                  const totals = calculatePaymentMethodTotals(expenses);
                  return Object.keys(totals).map(categoryName => {
                    const categoryTotal = totals[categoryName];
                    const categoryColor = getCategoryColor(categoryName);
                    const isExpanded = expandedCategories.has(categoryName);
                    const categoryExpenses = getExpensesByCategory(expenses, categoryName);

                    return (
                      <div key={categoryName} className="mb-2">
                        {/* Header Row */}
                        <div
                          onClick={() => toggleCategory(categoryName)}
                          className={`relative flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer transition-colors ${
                            theme === 'dark'
                              ? 'bg-zinc-900/40 hover:bg-zinc-800/50'
                              : 'bg-white/60 hover:bg-gray-100'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center relative"
                            style={{ backgroundColor: categoryColor }}
                          >
                            <ChevronDown
                              size={14}
                              className={`transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              } ${
                                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className={`text-lg ${
                              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                            }`}>
                              {categoryName}
                            </div>
                          </div>
                          <span className="font-semibold text-red-500">
                            {categoryTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="mt-2 ml-8">
                            {renderEntries(categoryExpenses, 'expense')}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              ) : (
                // Normal list
                renderEntries(expenses, 'expense')
              )}
            </div>
          )}
        </>
      );
    }

    // All tab
    const allEntries = getAllEntries();

    return (
      <div>
        {/* Gelir ve Gider Ekle Butonları */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => openModal('income')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
            }`}
          >
            <Plus size={20} />
            {t('addIncome')}
          </button>
          <button
            onClick={() => openModal('expense')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            }`}
          >
            <Minus size={20} />
            {t('addExpense')}
          </button>
        </div>

        {/* Net Card */}
        <div className={`mb-4 p-4 rounded-xl backdrop-blur-sm border ${
          theme === 'dark'
            ? 'bg-zinc-900/40 border-zinc-700/50'
            : 'bg-white/60 border-gray-200/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              {t('net')}
            </span>
            <span className={`text-2xl font-bold ${
              calculateNetAmount() === 0
                ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                : calculateNetAmount() > 0
                  ? 'text-green-500'
                  : 'text-red-500'
            }`}>
              {calculateNetAmount().toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>

        {/* Entries List */}
        {allEntries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Henüz işlem yok
            </p>
          </div>
        ) : (
          renderEntries(allEntries, 'all')
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab Bar */}
      <div className="w-full" style={{ marginTop: '60px' }}>
        <div className="flex h-12 relative">
          {tabs.map((tab, index) => (
            <div key={tab.id} className="flex flex-1 items-center">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-center font-semibold transition-colors ${
                  activeTab === tab.id
                    ? theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                    : theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </button>
              {index < tabs.length - 1 && (
                <svg
                  width="8"
                  height="48"
                  viewBox="0 0 8 48"
                  className="flex-shrink-0"
                >
                  <path
                    d="M 4 0 L 5 20 L 6 24 L 5 28 L 4 48 L 3 48 L 2 28 L 1 24 L 2 20 L 3 0 Z"
                    fill={theme === 'dark' ? '#22d3ee' : '#3b82f6'}
                    opacity="0.6"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-4 py-6 pb-24">
        {renderContent()}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.entry && (
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
            onClick={() => handleEditEntry(contextMenu.entry)}
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
            onClick={() => openDeleteConfirm(contextMenu.entry)}
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

      {/* Modal */}
      <GenericModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          editingEntry
            ? modalType === 'income' ? 'Geliri Düzenle' : 'Gideri Düzenle'
            : modalType === 'income' ? t('addIncome') : t('addExpense')
        }
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
              {t('title')}
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
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
              {t('amount')}
            </label>
            <input
              type="number"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
            />
          </div>

          {modalType === 'expense' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                {t('paymentMethod')}
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
              >
                {categories.length === 0 ? (
                  <option value="">Ödeme yöntemi yok</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

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
              {editingEntry ? 'Güncelle' : t('add')}
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
            {deleteConfirm.entry?.title
              ? `"${deleteConfirm.entry.title}" işlemini silmek istediğinize emin misiniz?`
              : 'Bu işlemi silmek istediğinize emin misiniz?'}
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
              onClick={handleDeleteEntry}
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

export default Budget;
