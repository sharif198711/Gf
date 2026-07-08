import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Initialize pool lazily to avoid crashing if connection details aren't provided yet
let pool: mysql.Pool | null = null;

export function resetDbPool(): void {
  if (pool) {
    pool.end().catch(err => console.error('Error ending pool during reset:', err));
    pool = null;
  }
}

export function getDbPool(): mysql.Pool | null {
  if (pool) return pool;

  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbPort = process.env.DB_PORT || 3306;

  if (!dbHost || !dbUser || !dbName) {
    console.log('⚠️ [Database] MySQL configuration is missing in environment variables. Falling back to localized server session memory.');
    return null;
  }

  try {
    pool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: Number(dbPort),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });
    console.log('📡 [Database] MySQL pool initialized successfully connecting to:', dbHost);
    return pool;
  } catch (error) {
    console.error('❌ [Database] Failed to initialize MySQL connection pool:', error);
    return null;
  }
}

// Check if database is fully operational and tables exist
export async function isDbConnected(): Promise<boolean> {
  const dbPool = getDbPool();
  if (!dbPool) return false;
  try {
    const connection = await dbPool.getConnection();
    // Safely add cash_balance column if it doesn't exist
    try {
      await connection.query('ALTER TABLE users ADD COLUMN cash_balance DECIMAL(15, 2) DEFAULT 0.00');
      console.log('✅ [Database] Added cash_balance column to users table.');
    } catch (colErr) {
      // Column already exists or table doesn't exist yet
    }
    connection.release();
    return true;
  } catch (err) {
    console.warn('⚠️ [Database] Connection check failed:', err);
    return false;
  }
}

export interface UserFinanceState {
  bankBalance: number;
  cashBalance?: number;
  gold: {
    grams: number;
    currentPricePerGram: number;
  };
  goal: {
    target: number;
    title: string;
  };
  categoryBudgets: { [key: string]: number };
  transactions: any[];
}

/**
 * Log in a user or create their account if not exists (Auto-Registration for seamless UX)
 */
export async function authenticateOrRegister(email: string, passwordPlain: string): Promise<{ userId: number; email: string; isNew: boolean } | null> {
  const dbPool = getDbPool();
  if (!dbPool) return null;

  try {
    // 1. Check if user exists
    const [rows]: any = await dbPool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      const user = rows[0];
      // Basic login verification (simple plain comparison or hash for hosting)
      if (user.password !== passwordPlain) {
        throw new Error('كلمة المرور غير صحيحة لهذا الحساب.');
      }
      return { userId: user.id, email: user.email, isNew: false };
    } else {
      // 2. Register new user with zero values so they can input their own data
      const [result]: any = await dbPool.query(
        'INSERT INTO users (email, password, bank_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, passwordPlain, 0.00, 0.000, 75.00, 10000.00, 'الهدف المالي الشخصي']
      );
      
      const userId = result.insertId;

      // Seed default budgets (all starting at 0.00)
      const defaultBudgets = [
        ['rent', 0.00],
        ['groceries', 0.00],
        ['utilities', 0.00],
        ['transportation', 0.00],
        ['health', 0.00],
        ['entertainment', 0.00],
        ['gold_buy', 0.00],
        ['other_expense', 0.00]
      ];

      for (const b of defaultBudgets) {
        await dbPool.query(
          'INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, ?)',
          [userId, b[0], b[1]]
        );
      }

      return { userId, email, isNew: true };
    }
  } catch (error: any) {
    console.error('❌ [Database] Error authenticating/registering user:', error);
    throw error;
  }
}

/**
 * Fetch complete financial state for a user from database
 */
export async function getUserFinanceState(userId: number): Promise<UserFinanceState | null> {
  const dbPool = getDbPool();
  if (!dbPool) return null;

  try {
    // 1. Fetch user core info
    const [userRows]: any = await dbPool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) return null;
    const user = userRows[0];

    // 2. Fetch transactions
    const [txRows]: any = await dbPool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC', [userId]);
    const transactions = txRows.map((row: any) => ({
      id: row.id,
      date: row.date instanceof Date ? row.date.toISOString().substring(0, 10) : row.date,
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      description: row.description,
      account: row.account,
      goldGrams: row.gold_grams ? Number(row.gold_grams) : undefined
    }));

    // 3. Fetch category budgets
    const [budgetRows]: any = await dbPool.query('SELECT * FROM category_budgets WHERE user_id = ?', [userId]);
    const categoryBudgets: { [key: string]: number } = {};
    budgetRows.forEach((row: any) => {
      categoryBudgets[row.category_key] = Number(row.limit_amount);
    });

    return {
      bankBalance: Number(user.bank_balance),
      cashBalance: user.cash_balance !== undefined && user.cash_balance !== null ? Number(user.cash_balance) : 0.00,
      gold: {
        grams: Number(user.gold_grams),
        currentPricePerGram: Number(user.gold_price_per_gram)
      },
      goal: {
        target: Number(user.goal_target),
        title: user.goal_title
      },
      categoryBudgets,
      transactions
    };
  } catch (error) {
    console.error(`❌ [Database] Failed to load finance state for user id ${userId}:`, error);
    throw error;
  }
}

/**
 * Save complete financial state back to database
 */
export async function saveUserFinanceState(userId: number, state: UserFinanceState): Promise<boolean> {
  const dbPool = getDbPool();
  if (!dbPool) return false;

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update user core details
    await connection.query(
      'UPDATE users SET bank_balance = ?, cash_balance = ?, gold_grams = ?, gold_price_per_gram = ?, goal_target = ?, goal_title = ? WHERE id = ?',
      [
        state.bankBalance,
        state.cashBalance !== undefined ? state.cashBalance : 0.00,
        state.gold.grams,
        state.gold.currentPricePerGram,
        state.goal.target,
        state.goal.title,
        userId
      ]
    );

    // 2. Replace transactions
    // To handle transactions properly: delete current ones and insert the new ones
    await connection.query('DELETE FROM transactions WHERE user_id = ?', [userId]);
    
    if (state.transactions && state.transactions.length > 0) {
      const insertQuery = 'INSERT INTO transactions (id, user_id, date, type, amount, category, description, account, gold_grams) VALUES ?';
      const values = state.transactions.map((tx: any) => [
        tx.id,
        userId,
        tx.date,
        tx.type,
        tx.amount,
        tx.category,
        tx.description || '',
        tx.account,
        tx.goldGrams || null
      ]);
      await connection.query(insertQuery, [values]);
    }

    // 3. Replace/Update category budgets
    await connection.query('DELETE FROM category_budgets WHERE user_id = ?', [userId]);
    
    if (state.categoryBudgets) {
      for (const [key, limit] of Object.entries(state.categoryBudgets)) {
        await connection.query(
          'INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, ?)',
          [userId, key, limit]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`❌ [Database] Transaction error during saving finance state for user id ${userId}:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Register a new user explicitly with zeroed financial data
 */
export async function registerUser(email: string, passwordPlain: string): Promise<{ userId: number; email: string } | null> {
  const dbPool = getDbPool();
  if (!dbPool) return null;

  try {
    const [rows]: any = await dbPool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      throw new Error('البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
    }

    const [result]: any = await dbPool.query(
      'INSERT INTO users (email, password, bank_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, passwordPlain, 0.00, 0.000, 75.00, 100000.00, 'توفير مئة ألف يورو']
    );
    const userId = result.insertId;

    const defaultBudgets = [
      ['rent', 0.00],
      ['groceries', 0.00],
      ['utilities', 0.00],
      ['transportation', 0.00],
      ['health', 0.00],
      ['entertainment', 0.00],
      ['gold_buy', 0.00],
      ['other_expense', 0.00]
    ];

    for (const b of defaultBudgets) {
      await dbPool.query(
        'INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, ?)',
        [userId, b[0], b[1]]
      );
    }

    return { userId, email };
  } catch (error: any) {
    console.error('❌ [Database] Error registering user:', error);
    throw error;
  }
}

/**
 * Login or register automatically with Google Gmail with zeroed initial data
 */
export async function loginWithGoogle(email: string): Promise<{ userId: number; email: string; isNew: boolean } | null> {
  const dbPool = getDbPool();
  if (!dbPool) return null;

  try {
    const [rows]: any = await dbPool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      const user = rows[0];
      return { userId: user.id, email: user.email, isNew: false };
    } else {
      const [result]: any = await dbPool.query(
        'INSERT INTO users (email, password, bank_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, 'GOOGLE_AUTH_NOPASSWORD', 0.00, 0.000, 75.00, 100000.00, 'توفير مئة ألف يورو']
      );
      const userId = result.insertId;

      const defaultBudgets = [
        ['rent', 0.00],
        ['groceries', 0.00],
        ['utilities', 0.00],
        ['transportation', 0.00],
        ['health', 0.00],
        ['entertainment', 0.00],
        ['gold_buy', 0.00],
        ['other_expense', 0.00]
      ];

      for (const b of defaultBudgets) {
        await dbPool.query(
          'INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, ?)',
          [userId, b[0], b[1]]
        );
      }

      return { userId, email, isNew: true };
    }
  } catch (error: any) {
    console.error('❌ [Database] Error Google auth:', error);
    throw error;
  }
}

/**
 * Admin: Get all users
 */
export async function adminGetAllUsers(): Promise<any[] | null> {
  const dbPool = getDbPool();
  if (!dbPool) return null;

  try {
    const [rows]: any = await dbPool.query(`
      SELECT id, email, bank_balance as bankBalance, gold_grams as goldGrams, 
             gold_price_per_gram as goldPricePerGram, goal_target as goalTarget, 
             goal_title as goalTitle, created_at as createdAt 
      FROM users 
      ORDER BY id ASC
    `);
    return rows;
  } catch (error) {
    console.error('❌ [Database] Error fetching all users:', error);
    throw error;
  }
}

/**
 * Admin: Delete user
 */
export async function adminDeleteUser(userId: number): Promise<boolean> {
  const dbPool = getDbPool();
  if (!dbPool) return false;

  try {
    await dbPool.query('DELETE FROM users WHERE id = ?', [userId]);
    return true;
  } catch (error) {
    console.error(`❌ [Database] Error deleting user ${userId}:`, error);
    throw error;
  }
}

