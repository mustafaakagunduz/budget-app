import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions, getUserCategories, addTransaction, subscribeToTransactions, unsubscribe } from '../lib/database';
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

  const tabs = [
    { id: 'income', label: t('income') },
    { id: 'all', label: t('all') },
    { id: 'expense', label: t('expense') }
  ];

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

  const openModal = (type) => {
    setModalType(type);
    setFormTitle('');
    setFormAmount('');
    setError('');

    // Kategorileri yeniden yükle
    loadCategories().then(() => {
      if (type === 'expense' && categories.length > 0) {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formTitle.trim() || !formAmount.trim()) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (modalType === 'expense' && !formCategory) {
      setError('Kategori seçin');
      return;
    }

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
      // Realtime subscription otomatik güncelleyecek
    }
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

  const renderEntries = (entries, type) => {
    return entries.map((entry) => (
      <div
        key={entry.id}
        className="flex items-center gap-3 py-3 px-4 mb-2 rounded-lg"
      >
        {/* Color indicator for expenses */}
        {(type === 'expense' || entry.type === 'expense') && entry.category && (
          <div
            className="w-1.5 h-12 rounded-full"
            style={{ backgroundColor: getCategoryColor(entry.category) }}
          />
        )}
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
    ));
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
            <button
              onClick={() => openModal('income')}
              className={`w-full py-3 mb-4 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-cyan-400 hover:bg-zinc-700'
                  : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
              }`}
            >
              {t('addIncome')}
            </button>
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
            <button
              onClick={() => openModal('expense')}
              className={`w-full py-3 mb-4 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-cyan-400 hover:bg-zinc-700'
                  : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
              }`}
            >
              {t('addExpense')}
            </button>
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
              {renderEntries(expenses, 'expense')}
            </div>
          )}
        </>
      );
    }

    // All tab
    const allEntries = getAllEntries();

    return (
      <div>
        {allEntries.length > 0 && renderEntries(allEntries, 'all')}
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
      <div className="flex-1 flex flex-col px-4 py-6 pb-32">
        {renderContent()}
      </div>

      {/* Net Amount Bar */}
      <div className="fixed bottom-24 left-0 right-0 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <span className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            {activeTab === 'all' ? t('net') : activeTab === 'income' ? t('income') : t('expense')}
          </span>
          <span className={`text-xl font-bold ${
            calculateNetAmount() >= 0
              ? 'text-green-500'
              : 'text-red-500'
          }`}>
            {calculateNetAmount().toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </span>
        </div>
      </div>

      {/* Modal */}
      <GenericModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalType === 'income' ? t('addIncome') : t('addExpense')}
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
                {t('category')}
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
                  <option value="">Kategori yok</option>
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
              {t('add')}
            </button>
          </div>
        </form>
      </GenericModal>
    </div>
  );
};

export default Budget;
