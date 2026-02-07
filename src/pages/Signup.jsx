import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Signup({ theme = 'dark' }) {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const isDark = theme === 'dark';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Şifre eşleşme kontrolü (realtime)
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword') {
        setPasswordMatch(value === formData.password || value === '');
      } else if (name === 'password') {
        setPasswordMatch(formData.confirmPassword === value || formData.confirmPassword === '');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasyon
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setPasswordMatch(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);

    const { data, error } = await signup(formData.email, formData.password);

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      // Verification sayfasına yönlendir
      navigate('/verify-email', { state: { userId: data.id, email: data.email } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className={`w-full max-w-md ${
        isDark ? 'bg-zinc-900/80' : 'bg-white/80'
      } backdrop-blur-sm rounded-2xl shadow-xl p-8 border ${
        isDark ? 'border-cyan-500/20' : 'border-blue-200'
      }`}>
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            Kayıt Ol
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Yeni hesap oluştur
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 text-sm">{error}</p>
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
                name="email"
                value={formData.email}
                onChange={handleChange}
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

          {/* Password Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Şifre
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-cyan-500' : 'text-blue-500'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
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

          {/* Confirm Password Input */}
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
                onChange={handleChange}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !passwordMatch}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-600 text-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Zaten hesabın var mı?{' '}
            <Link
              to="/login"
              className={`font-semibold ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              } transition-colors`}
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
