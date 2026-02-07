import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login({ theme = 'dark' }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Tüm alanları doldurun');
      return;
    }

    setLoading(true);

    const { data, error } = await login(formData.email, formData.password, formData.rememberMe);

    setLoading(false);

    if (error) {
      // Eğer email doğrulanmamışsa verification sayfasına yönlendir
      if (error.includes('doğrula') && data?.userId) {
        navigate('/verify-email', { state: { userId: data.userId, email: formData.email } });
      } else {
        setError(error);
      }
    } else {
      // Başarılı login - home'a yönlendir
      navigate('/home');
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
            Giriş Yap
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Hesabına giriş yap
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className={`w-4 h-4 rounded border ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-cyan-500/20'
                    : 'bg-gray-50 border-gray-300 text-blue-600 focus:ring-blue-500/20'
                } focus:ring-2 transition-all cursor-pointer`}
              />
              <span className={`ml-2 text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Beni Hatırla
              </span>
            </label>

            <Link
              to="/forgot-password"
              className={`text-sm font-medium ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              } transition-colors`}
            >
              Şifremi Unuttum
            </Link>
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
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Hesabın yok mu?{' '}
            <Link
              to="/signup"
              className={`font-semibold ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              } transition-colors`}
            >
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
