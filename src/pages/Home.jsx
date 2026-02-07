import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calculateTotals, subscribeToTransactions, unsubscribe } from '../lib/database';
import NeonCircle from '../components/NeonCircle';

const Home = ({ theme, currency }) => {
  const { user } = useAuth();
  const [rates, setRates] = useState({ USD: 34.5 });
  const [isHidden, setIsHidden] = useState(false);
  const [netAmount, setNetAmount] = useState(0);
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

  // Load totals from database
  useEffect(() => {
    if (user?.id) {
      loadTotals();
    }
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToTransactions(user.id, () => {
      // Transaction değiştiğinde totals'ı yeniden hesapla
      loadTotals();
    });

    return () => {
      unsubscribe(subscription);
    };
  }, [user?.id]);

  const loadTotals = async () => {
    setLoading(true);
    const { data, error } = await calculateTotals(user.id);

    if (error) {
      console.error('Calculate totals error:', error);
      setNetAmount(0);
    } else {
      setNetAmount(data?.netAmount || 0);
    }
    setLoading(false);
  };

  const getConvertedAmount = () => {
    if (currency === 'TRY') return netAmount;
    if (currency === 'USD' && rates.USD && !isNaN(rates.USD)) {
      return netAmount / rates.USD;
    }
    return netAmount;
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
    <div className="flex-1 flex items-start justify-center pt-[20vh] pb-32">
      <NeonCircle
        amount={getConvertedAmount()}
        theme={theme}
        currencySymbol={getCurrencySymbol()}
        isHidden={isHidden}
        onToggleHidden={() => setIsHidden(!isHidden)}
      />
    </div>
  );
};

export default Home;
