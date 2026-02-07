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
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
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
          setUser(data);
        } else {
          localStorage.removeItem('rememberToken');
        }
      }
    } catch (error) {
      console.error('Check user error:', error);
    } finally {
      setLoading(false);
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
        .single();

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
      const response = await fetch('http://localhost:3001/api/send-verification-code', {
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

  // Logout
  const logout = async () => {
    try {
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
      const response = await fetch('http://localhost:3001/api/send-verification-code', {
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
    logout,
    forgotPassword,
    verifyResetCode,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
