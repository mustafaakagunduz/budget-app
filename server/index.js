import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// 6 haneli kod üret
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email gönder
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

// POST /api/send-verification-code
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { userId, email, type } = req.body;

    if (!userId || !email || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 6 haneli kod üret
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    // Kodu veritabanına kaydet
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        code,
        type,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save verification code' });
    }

    // Email içeriği
    const subject = type === 'signup'
      ? 'Email Doğrulama Kodu'
      : 'Şifre Sıfırlama Kodu';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #06b6d4;">${subject}</h2>
        <p>Merhaba,</p>
        <p>Doğrulama kodunuz:</p>
        <div style="background-color: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #0891b2; letter-spacing: 8px; margin: 0; font-size: 36px;">${code}</h1>
        </div>
        <p style="color: #64748b;">Bu kod 10 dakika içinde geçerliliğini kaybedecektir.</p>
        <p style="color: #64748b;">Eğer bu işlemi siz yapmadıysanız, bu e-postayı dikkate almayın.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Budget App - Bütçe Yönetim Uygulaması</p>
      </div>
    `;

    // Email gönder
    const emailResult = await sendEmail(email, subject, html);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.json({ success: true, message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
