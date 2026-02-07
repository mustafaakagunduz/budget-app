import { supabase } from './supabase';

// =============================================
// PAYMENT METHODS
// =============================================

const DEFAULT_PAYMENT_METHODS = [
  { name: 'Nakit', color: '#22c55e' },
  { name: 'Kredi Kartı', color: '#3b82f6' },
  { name: 'Yemek Kartı', color: '#f97316' }
];

/**
 * Kullanıcının tüm kategorilerini getir
 */
export async function getUserCategories(userId) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from('payment_methods')
        .insert(
          DEFAULT_PAYMENT_METHODS.map((method) => ({
            user_id: userId,
            name: method.name,
            color: method.color,
            is_default: true
          }))
        );

      if (insertError) throw insertError;

      const { data: seededData, error: seededError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (seededError) throw seededError;
      return { data: seededData, error: null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Get categories error:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Yeni kategori ekle
 */
export async function addCategory(userId, name, color) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        name,
        color,
        is_default: false
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Add category error:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Kategori sil
 */
export async function deleteCategory(categoryId) {
  try {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Delete category error:', error);
    return { error: error.message };
  }
}

/**
 * Kategori güncelle
 */
export async function updateCategory(categoryId, updates) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update category error:', error);
    return { data: null, error: error.message };
  }
}

// =============================================
// TRANSACTIONS (Income & Expense)
// =============================================

/**
 * Kullanıcının tüm transaction'larını getir
 */
export async function getUserTransactions(userId, type = null) {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    // Type filter (income, expense, veya null=all)
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get transactions error:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Yeni transaction ekle (income veya expense)
 */
export async function addTransaction(userId, type, title, amount, category = null, timestamp = null) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        title,
        amount,
        category: type === 'expense' ? category : null,
        timestamp: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Add transaction error:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Transaction güncelle
 */
export async function updateTransaction(transactionId, updates) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update transaction error:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Transaction sil
 */
export async function deleteTransaction(transactionId) {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Delete transaction error:', error);
    return { error: error.message };
  }
}

/**
 * Gelir/Gider toplamlarını hesapla
 */
export async function calculateTotals(userId) {
  try {
    // Tüm transactions'ları getir
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);

    if (error) throw error;

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      data: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense
      },
      error: null
    };
  } catch (error) {
    console.error('Calculate totals error:', error);
    return { data: null, error: error.message };
  }
}

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================

/**
 * Transactions değişikliklerini dinle (realtime)
 */
export function subscribeToTransactions(userId, callback) {
  const subscription = supabase
    .channel('transactions-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return subscription;
}

/**
 * Categories değişikliklerini dinle (realtime)
 */
export function subscribeToCategories(userId, callback) {
  const subscription = supabase
    .channel('categories-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_methods',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return subscription;
}

/**
 * Subscription'ı kapat
 */
export function unsubscribe(subscription) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}
