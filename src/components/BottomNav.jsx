import { Home, ArrowUpDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = ({ theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: t('home'), path: '/home' },
    { icon: ArrowUpDown, label: t('incomeExpense'), path: '/budget' },
    { icon: TrendingUp, label: t('investment'), path: '/investments' }
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t ${
      theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300'
    }`}>
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`flex items-center justify-center transition-colors ${
              location.pathname === item.path
                ? theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                : theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
            }`}
          >
            <item.icon size={32} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
