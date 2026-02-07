import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function VerifyEmail({ theme = 'dark' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail } = useAuth();

  const userId = location.state?.userId;
  const email = location.state?.email;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef([]);

  const isDark = theme === 'dark';

  useEffect(() => {
    // Eğer userId veya email yoksa login'e yönlendir
    if (!userId || !email) {
      navigate('/login');
    }
  }, [userId, email, navigate]);

  const handleChange = (index, value) => {
    // Sadece rakam kabul et
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Otomatik olarak bir sonraki input'a geç
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace ile önceki input'a geç
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);

    if (/^\d+$/.test(pasteData)) {
      const newCode = pasteData.split('');
      setCode([...newCode, ...Array(6 - newCode.length).fill('')]);

      // Son dolu input'a focus et
      const lastIndex = Math.min(pasteData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('6 haneli kodu tam olarak girin');
      return;
    }

    setLoading(true);

    const { data, error } = await verifyEmail(userId, fullCode);

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);

      // 1.5 saniye sonra home'a yönlendir
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`w-full max-w-md ${
          isDark ? 'bg-zinc-900/80' : 'bg-white/80'
        } backdrop-blur-sm rounded-2xl shadow-xl p-8 border ${
          isDark ? 'border-cyan-500/20' : 'border-blue-200'
        } text-center`}>
          <CheckCircle className={`w-20 h-20 mx-auto mb-4 ${
            isDark ? 'text-green-400' : 'text-green-600'
          }`} />
          <h2 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            Email Doğrulandı!
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Hesabınız başarıyla oluşturuldu. Yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className={`w-full max-w-md ${
        isDark ? 'bg-zinc-900/80' : 'bg-white/80'
      } backdrop-blur-sm rounded-2xl shadow-xl p-8 border ${
        isDark ? 'border-cyan-500/20' : 'border-blue-200'
      }`}>
        {/* Icon */}
        <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${
          isDark ? 'bg-cyan-500/10' : 'bg-blue-100'
        } flex items-center justify-center`}>
          <Mail className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            Email Doğrulama
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className={isDark ? 'text-cyan-400' : 'text-blue-600'}>{email}</span> adresine
            gönderilen 6 haneli kodu girin
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* 6 Haneli Kod Input */}
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-cyan-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 ${
                  isDark ? 'focus:ring-cyan-500/20' : 'focus:ring-blue-500/20'
                } transition-all`}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || code.some(d => !d)}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-600 text-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Doğrulanıyor...' : 'Doğrula'}
          </button>
        </form>

        {/* Resend Link */}
        <div className="mt-6 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Kod gelmedi mi?{' '}
            <button
              type="button"
              className={`font-semibold ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              } transition-colors`}
            >
              Tekrar Gönder
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
