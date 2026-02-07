import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ResetPassword({ theme = 'dark' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyResetCode, resetPassword } = useAuth();

  const userId = location.state?.userId;
  const email = location.state?.email;

  const [step, setStep] = useState('code'); // 'code' or 'password'
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verificationId, setVerificationId] = useState(null);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const inputRefs = useRef([]);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!userId || !email) {
      navigate('/forgot-password');
    }
  }, [userId, email, navigate]);

  const handleCodeChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
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

      const lastIndex = Math.min(pasteData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('6 haneli kodu tam olarak girin');
      return;
    }

    setLoading(true);

    const { data, error } = await verifyResetCode(userId, fullCode);

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setVerificationId(data.verificationId);
      setStep('password');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'confirmPassword' || name === 'newPassword') {
      if (name === 'confirmPassword') {
        setPasswordMatch(value === formData.newPassword || value === '');
      } else if (name === 'newPassword') {
        setPasswordMatch(formData.confirmPassword === value || formData.confirmPassword === '');
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setPasswordMatch(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);

    const { data, error } = await resetPassword(userId, verificationId, formData.newPassword);

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
            Şifre Değiştirildi!
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...
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
          <Lock className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            {step === 'code' ? 'Kodu Girin' : 'Yeni Şifre Belirleyin'}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {step === 'code'
              ? `${email} adresine gönderilen 6 haneli kodu girin`
              : 'Yeni şifrenizi belirleyin'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        {step === 'code' ? (
          /* Kod Girişi */
          <form onSubmit={handleCodeSubmit}>
            <div className="flex justify-center gap-2 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
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
        ) : (
          /* Yeni Şifre Girişi */
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {/* Yeni Şifre */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Yeni Şifre
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-cyan-500' : 'text-blue-500'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full pl-11 pr-12 py-3 rounded-lg border ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-white focus:border-cyan-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 ${
                    isDark ? 'focus:ring-cyan-500/20' : 'focus:ring-blue-500/20'
                  } transition-all`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Şifre Tekrar
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-cyan-500' : 'text-blue-500'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full pl-11 pr-12 py-3 rounded-lg border ${
                    !passwordMatch && formData.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                  } focus:outline-none focus:ring-2 transition-all`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!passwordMatch && formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Şifreler eşleşmiyor</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordMatch}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-black'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
