import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Vercel serverless function
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, type } = req.body;

    if (!userId || !email || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // 6 haneli kod üret
    const code = Math.floor(100000 + Math.random() * 900000).toString();
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

    // Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

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
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject,
      html
    });

    res.status(200).json({ success: true, message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
