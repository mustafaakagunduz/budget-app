import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login({ theme = 'dark' }) {
  const navigate = useNavigate();
  const { user, loading: authLoading, login, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/home');
    }
  }, [authLoading, user, navigate]);

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

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const { error } = await loginWithGoogle();

    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <h1 className={`text-4xl font-bold mb-3 ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            Giriş Yap
          </h1>
          
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-zinc-800/50 border-zinc-700 text-white focus:border-cyan-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
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
                className={`w-full pl-11 pr-12 py-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-zinc-800/50 border-zinc-700 text-white focus:border-cyan-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
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
                    : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500/20'
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
            className={`w-full py-3.5 rounded-xl font-semibold transition-all shadow-lg ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-600 text-black shadow-cyan-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className={`absolute inset-0 flex items-center ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`}>
            <div className={`w-full border-t ${
              isDark ? 'border-zinc-700' : 'border-gray-300'
            }`}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-4 ${
              isDark ? 'bg-zinc-950 text-gray-500' : 'bg-gray-50 text-gray-500'
            }`}>
              veya
            </span>
          </div>
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading || authLoading}
          className={`w-full py-3.5 rounded-xl font-medium transition-all border flex items-center justify-center gap-3 ${
            isDark
              ? 'bg-white hover:bg-gray-100 border-gray-300 text-gray-900'
              : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-900 shadow-sm'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? 'Google yönlendiriliyor...' : 'Google ile Giriş Yap'}
        </button>

        {/* Signup Link */}
        <div className="mt-8 text-center">
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
