import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ForgotPassword({ theme = 'dark' }) {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email adresi girin');
      return;
    }

    setLoading(true);

    const { data, error } = await forgotPassword(email);

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSent(true);
      // 2 saniye sonra reset password sayfasına yönlendir
      setTimeout(() => {
        navigate('/reset-password', { state: { userId: data.userId, email } });
      }, 2000);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`w-full max-w-md ${
          isDark ? 'bg-zinc-900/80' : 'bg-white/80'
        } backdrop-blur-sm rounded-2xl shadow-xl p-8 border ${
          isDark ? 'border-cyan-500/20' : 'border-blue-200'
        } text-center`}>
          <Send className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`} />
          <h2 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            Email Gönderildi!
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            <span className={isDark ? 'text-cyan-400' : 'text-blue-600'}>{email}</span> adresine
            şifre sıfırlama kodu gönderildi.
          </p>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Yönlendiriliyorsunuz...
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
            Şifremi Unuttum
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Email adresinize şifre sıfırlama kodu göndereceğiz
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-cyan-500' : 'text-blue-500'
              }`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-lg border ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-cyan-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 ${
                  isDark ? 'focus:ring-cyan-500/20' : 'focus:ring-blue-500/20'
                } transition-all`}
                placeholder="ornek@email.com"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-600 text-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className={`text-sm ${
              isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-600 hover:text-blue-600'
            } transition-colors`}
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
