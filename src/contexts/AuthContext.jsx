import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sayfa yüklendiğinde kullanıcıyı kontrol et
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      await checkUser();
      if (isMounted) {
        setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user?.email) {
        const { data, error } = await getOrCreateOAuthUser(session.user.email);
        if (!error && data) {
          setUser(data);
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const getOrCreateOAuthUser = async (email) => {
    try {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('OAuth user lookup error:', error);
        return { error: 'Kullanıcı bilgisi alınamadı' };
      }

      if (existingUser) {
        if (!existingUser.is_verified) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ is_verified: true })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (updateError) {
            return { error: 'Kullanıcı güncellenemedi' };
          }

          return { data: updatedUser };
        }

        return { data: existingUser };
      }

      const randomPassword = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          is_verified: true
        })
        .select()
        .single();

      if (insertError) {
        return { error: 'Google ile giriş sırasında kullanıcı oluşturulamadı' };
      }

      return { data: newUser };
    } catch (error) {
      console.error('OAuth user error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const checkUser = async () => {
    try {
      let currentUser = null;

      // LocalStorage'dan remember token kontrol et
      const rememberToken = localStorage.getItem('rememberToken');

      if (rememberToken) {
        // Token ile kullanıcıyı bul
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('remember_token', rememberToken)
          .eq('is_verified', true)
          .single();

        if (data && !error) {
          currentUser = data;
        } else {
          localStorage.removeItem('rememberToken');
        }
      }

      if (!currentUser) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && sessionData?.session?.user?.email) {
          const { data: oauthUser, error: oauthError } = await getOrCreateOAuthUser(
            sessionData.session.user.email
          );
          if (!oauthError && oauthUser) {
            currentUser = oauthUser;
          }
        }
      }

      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Check user error:', error);
    }
  };

  // Kullanıcı kaydı (email + şifre)
  const signup = async (email, password) => {
    try {
      // Email kontrolü
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return { error: 'Bu email adresi zaten kayıtlı' };
      }

      // Şifre hash'le
      const passwordHash = await bcrypt.hash(password, 10);

      // Kullanıcı oluştur
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          is_verified: false
        })
        .select()
        .single();

      if (insertError) {
        return { error: 'Kayıt sırasında hata oluştu' };
      }

      // Verification code gönder
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUser.id,
          email: newUser.email,
          type: 'signup'
        })
      });

      if (!response.ok) {
        return { error: 'Email gönderilemedi' };
      }

      return { data: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  // Email verification
  const verifyEmail = async (userId, code) => {
    try {
      // Kodu kontrol et
      const { data: verificationData, error: verifyError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('type', 'signup')
        .eq('used', false)
        .single();

      if (verifyError || !verificationData) {
        return { error: 'Geçersiz kod' };
      }

      // Kodun süresi dolmuş mu kontrol et
      if (new Date(verificationData.expires_at) < new Date()) {
        return { error: 'Kodun süresi dolmuş' };
      }

      // Kodu kullanılmış olarak işaretle
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', verificationData.id);

      // Kullanıcıyı verified olarak işaretle
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        return { error: 'Doğrulama hatası' };
      }

      // Otomatik login
      setUser(updatedUser);
      return { data: updatedUser };
    } catch (error) {
      console.error('Verify email error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  // Login
  const login = async (email, password, rememberMe = false) => {
    try {
      // Kullanıcıyı bul
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return { error: 'Email veya şifre hatalı' };
      }

      // Şifre kontrolü
      const passwordMatch = await bcrypt.compare(password, userData.password_hash);
      if (!passwordMatch) {
        return { error: 'Email veya şifre hatalı' };
      }

      // Email doğrulanmış mı kontrol et
      if (!userData.is_verified) {
        return { error: 'Email adresinizi doğrulamanız gerekiyor', userId: userData.id };
      }

      // Beni hatırla seçiliyse
      if (rememberMe) {
        // Sonsuz süreli token oluştur
        const rememberToken = crypto.randomUUID();

        await supabase
          .from('users')
          .update({ remember_token: rememberToken })
          .eq('id', userData.id);

        localStorage.setItem('rememberToken', rememberToken);
        userData.remember_token = rememberToken;
      }

      setUser(userData);
      return { data: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        return { error: 'Google ile giriş başlatılamadı' };
      }

      return { data: { started: true } };
    } catch (error) {
      console.error('Google login error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();

      // Remember token'ı temizle
      if (user?.remember_token) {
        await supabase
          .from('users')
          .update({ remember_token: null })
          .eq('id', user.id);
      }

      localStorage.removeItem('rememberToken');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Şifremi unuttum
  const forgotPassword = async (email) => {
    try {
      // Kullanıcıyı bul
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return { error: 'Bu email adresiyle kayıtlı kullanıcı bulunamadı' };
      }

      // Reset code gönder
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          email: userData.email,
          type: 'password_reset'
        })
      });

      if (!response.ok) {
        return { error: 'Email gönderilemedi' };
      }

      return { data: { userId: userData.id } };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  // Şifre sıfırlama kodunu doğrula
  const verifyResetCode = async (userId, code) => {
    try {
      const { data: verificationData, error: verifyError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('type', 'password_reset')
        .eq('used', false)
        .single();

      if (verifyError || !verificationData) {
        return { error: 'Geçersiz kod' };
      }

      if (new Date(verificationData.expires_at) < new Date()) {
        return { error: 'Kodun süresi dolmuş' };
      }

      return { data: { verificationId: verificationData.id } };
    } catch (error) {
      console.error('Verify reset code error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  // Yeni şifre belirleme
  const resetPassword = async (userId, verificationId, newPassword) => {
    try {
      // Şifreyi hash'le
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Şifreyi güncelle
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', userId);

      if (updateError) {
        return { error: 'Şifre güncellenemedi' };
      }

      // Verification kodunu kullanılmış olarak işaretle
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', verificationId);

      return { data: { success: true } };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const value = {
    user,
    loading,
    signup,
    verifyEmail,
    login,
    loginWithGoogle,
    logout,
    forgotPassword,
    verifyResetCode,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
