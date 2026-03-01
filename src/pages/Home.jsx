import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calculateMonthlyTotals, subscribeToTransactions, unsubscribe } from '../lib/database';
import NeonCircle from '../components/NeonCircle';

const MONTH_NAMES_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const Home = ({ theme, currency }) => {
  const { user } = useAuth();
  const [rates, setRates] = useState({ USD: 34.5 });
  const [isHidden, setIsHidden] = useState(false);
  const [monthlyTotals, setMonthlyTotals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const usdResponse = await fetch(
          `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TRY&apikey=${import.meta.env.VITE_ALPHA_VANTAGE_API_KEY}`
        );
        const usdData = await usdResponse.json();
        const usdRate = parseFloat(usdData['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);

        setRates(prev => ({
          USD: usdRate && !isNaN(usdRate) ? usdRate : prev.USD
        }));
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    fetchRates();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadMonthlyTotals();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToTransactions(user.id, () => {
      loadMonthlyTotals();
    });

    return () => {
      unsubscribe(subscription);
    };
  }, [user?.id]);

  const loadMonthlyTotals = async () => {
    setLoading(true);
    const { data, error } = await calculateMonthlyTotals(user.id);
    if (!error && data) {
      setMonthlyTotals(data);
    }
    setLoading(false);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthData = monthlyTotals.find(m => m.key === currentMonthKey);
  const currentMonthNet = currentMonthData?.net ?? 0;
  const pastMonths = monthlyTotals.filter(m => m.key < currentMonthKey);

  const getConvertedNet = (net) => {
    if (currency === 'TRY') return net;
    if (currency === 'USD' && rates.USD && !isNaN(rates.USD)) {
      return net / rates.USD;
    }
    return net;
  };

  const getCurrencySymbol = () => {
    if (currency === 'TRY') return '₺';
    if (currency === 'USD') return '$';
    return '₺';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pt-[20vh] pb-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center pt-[10vh] pb-32 px-4">
      <NeonCircle
        amount={getConvertedNet(currentMonthNet)}
        theme={theme}
        currencySymbol={getCurrencySymbol()}
        isHidden={isHidden}
        onToggleHidden={() => setIsHidden(!isHidden)}
        monthLabel={`${MONTH_NAMES_TR[currentMonth]} ${currentYear}`}
      />

      {pastMonths.length > 0 && (
        <div className="w-full max-w-sm mt-8 space-y-2">
          {pastMonths.map(m => {
            const converted = getConvertedNet(m.net);
            const symbol = getCurrencySymbol();
            const isPositive = converted >= 0;
            return (
              <div
                key={m.key}
                className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                  theme === 'dark'
                    ? 'bg-zinc-900/40 border border-zinc-800/50'
                    : 'bg-white/60 border border-gray-200/50'
                }`}
              >
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  {MONTH_NAMES_TR[m.month]} {m.year}
                </span>
                <span className={`font-semibold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '' : '-'}{symbol}{Math.abs(converted).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
