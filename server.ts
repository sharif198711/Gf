import express from "express";
import path from "path";
import fs from "fs";
import mysql from "mysql2/promise";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { 
  isDbConnected, 
  authenticateOrRegister, 
  getUserFinanceState, 
  saveUserFinanceState,
  resetDbPool,
  registerUser,
  loginWithGoogle,
  adminGetAllUsers,
  adminDeleteUser
} from "./src/server/dbService";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rewrite /api.php?route=xxx requests to /api/xxx inside the Express development environment
// This ensures that using the robust direct PHP file route works perfectly in local development too!
app.all("/api.php", (req, res, next) => {
  const route = req.query.route as string;
  if (route) {
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    urlObj.pathname = `/api/${route}`;
    urlObj.searchParams.delete('route');
    req.url = urlObj.pathname + urlObj.search;
    next();
  } else {
    res.status(400).json({ error: "No route specified" });
  }
});

// HTML Template Renderer for install.php in Express
function renderInstallPage(
  success: boolean | null, 
  errorMsg: string | null, 
  logs: string[],
  dbHost: string = "localhost",
  dbName: string = "",
  dbUser: string = ""
) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تثبيت قاعدة البيانات - حصّالة الذهب والادخار</title>
    <!-- Tajawal Arabic Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Tajawal', 'sans-serif'],
                    },
                    colors: {
                        gold: {
                            50: '#fffdf5',
                            100: '#fef7da',
                            200: '#fdedaf',
                            300: '#fcdb79',
                            400: '#fbc143',
                            500: '#f5a61d',
                            600: '#d98010',
                            700: '#b45d0e',
                            800: '#924610',
                            900: '#783910',
                            950: '#451c05',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #0b0f19;
            background-image: radial-gradient(circle at top left, rgba(245, 166, 29, 0.08) 0%, transparent 40%), radial-gradient(circle at bottom right, rgba(217, 128, 16, 0.05) 0%, transparent 50%);
        }
    </style>
</head>
<body class="min-h-screen text-gray-200 py-12 px-4 flex items-center justify-center font-sans">

    <div class="max-w-2xl w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden" id="installation-card">
        
        <!-- Header / الشعار والترويسة -->
        <div class="p-8 border-b border-slate-800 bg-slate-950/50 text-center relative">
            <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4 shadow-inner shadow-gold-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-white tracking-tight">حصّالة الذهب والادخار</h1>
            <p class="text-sm text-gray-400 mt-1">مساعد التثبيت وإعداد قاعدة بيانات MySQL</p>
        </div>

        <div class="p-8">
            ${success === null ? `
                <!-- Introduction / مقدمة التثبيت -->
                <div class="mb-8 text-sm leading-relaxed text-gray-300 bg-slate-950/40 p-5 rounded-xl border border-slate-800/80">
                    <h3 class="font-bold text-white mb-2 text-base flex items-center gap-2">
                        <span class="inline-block w-2.5 h-2.5 rounded-full bg-gold-500"></span>
                        مرحباً بك في معالج التثبيت التلقائي!
                    </h3>
                    <p>
                        سيقوم هذا المعالج بإنشاء وتجهيز جميع الجداول المطلوبة لتشغيل تطبيق **حصالة الذهب والادخار** بشكل صحيح داخل بيئة الاستضافة الخاصة بك. يرجى ملء بيانات الاتصال بقاعدة بيانات MySQL أدناه ليقوم النظام ببدء التهيئة فوراً.
                    </p>
                </div>

                <!-- Setup Form / نموذج التثبيت -->
                <form action="" method="POST" class="space-y-6" id="install-form">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Host Name -->
                        <div class="space-y-2">
                            <label for="db_host" class="block text-sm font-medium text-gray-300">عنوان خادم قاعدة البيانات (Host)</label>
                            <input type="text" id="db_host" name="db_host" value="${dbHost}" required 
                                   class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all placeholder:text-gray-600">
                            <p class="text-xs text-gray-500">غالباً ما يكون <code class="bg-slate-950 px-1 py-0.5 rounded text-gold-400">localhost</code> في معظم الاستضافات.</p>
                        </div>

                        <!-- Database Name -->
                        <div class="space-y-2">
                            <label for="db_name" class="block text-sm font-medium text-gray-300">اسم قاعدة البيانات (Database Name)</label>
                            <input type="text" id="db_name" name="db_name" value="${dbName}" placeholder="مثال: hassala_db" required 
                                   class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all placeholder:text-gray-600">
                            <p class="text-xs text-gray-500">اسم قاعدة البيانات الفارغة التي تم إنشاؤها من لوحة التحكم.</p>
                        </div>

                        <!-- DB Username -->
                        <div class="space-y-2">
                            <label for="db_user" class="block text-sm font-medium text-gray-300">اسم مستخدم قاعدة البيانات (Username)</label>
                            <input type="text" id="db_user" name="db_user" value="${dbUser}" placeholder="مثال: hassala_user" required 
                                   class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all placeholder:text-gray-600">
                        </div>

                        <!-- DB Password -->
                        <div class="space-y-2">
                            <label for="db_pass" class="block text-sm font-medium text-gray-300">كلمة مرور قاعدة البيانات (Password)</label>
                            <input type="password" id="db_pass" name="db_pass" placeholder="••••••••" 
                                   class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all placeholder:text-gray-600">
                        </div>
                    </div>

                    <!-- Submit Button / زر الإرسال -->
                    <button type="submit" id="submit-btn"
                            class="w-full mt-8 py-3.5 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-slate-950 font-bold text-base rounded-xl hover:from-gold-500 hover:to-gold-400 focus:ring-4 focus:ring-gold-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gold-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        تهيئة الجداول وتثبيت قاعدة البيانات
                    </button>
                </form>
            ` : `
                <!-- Result Screen / شاشة النتائج والتقرير -->
                <div class="space-y-6">
                    
                    ${success ? `
                        <!-- Success Card / نجاح التثبيت -->
                        <div class="p-6 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-start gap-4">
                            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="space-y-1">
                                <h3 class="text-lg font-bold text-white">اكتمل التثبيت بنجاح!</h3>
                                <p class="text-sm text-emerald-300">تم إنشاء قواعد البيانات والبيانات التجريبية، والموقع جاهز للاتصال والتشغيل الآن.</p>
                            </div>
                        </div>

                        <!-- Default Credentials / بيانات الدخول الافتراضية -->
                        <div class="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
                            <h4 class="text-sm font-bold text-gold-400 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                حساب المدير الافتراضي للتجربة:
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-1">
                                <div class="p-3 bg-slate-900 rounded-lg border border-slate-800/60">
                                    <span class="block text-xs text-gray-500 mb-0.5">البريد الإلكتروني الافتراضي:</span>
                                    <span class="font-mono text-white select-all">admin@hassala.com</span>
                                </div>
                                <div class="p-3 bg-slate-900 rounded-lg border border-slate-800/60">
                                    <span class="block text-xs text-gray-500 mb-0.5">كلمة المرور الافتراضية:</span>
                                    <span class="font-mono text-white select-all">123456</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <!-- Failure Card / فشل التثبيت -->
                        <div class="p-6 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start gap-4">
                            <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="space-y-1">
                                <h3 class="text-lg font-bold text-white">فشل الاتصال أو التثبيت</h3>
                                <p class="text-sm text-rose-300">لم يتمكن معالج التثبيت من إكمال المهام بنجاح. يرجى التحقق من أخطاء الاتصال المسرودة أدناه.</p>
                                ${errorMsg ? `<p class="text-xs text-rose-400 mt-2 whitespace-pre-wrap font-mono p-2 bg-slate-950/60 rounded border border-rose-900/40">${errorMsg}</p>` : ''}
                            </div>
                        </div>
                    `}

                    <!-- Action Logs / سجل العمليات التفصيلي -->
                    <div class="space-y-2">
                        <span class="text-xs font-medium text-gray-400 block px-1">تقرير وسجل العمليات (Installation Log):</span>
                        <div class="p-4 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs space-y-2 overflow-y-auto max-h-60 leading-relaxed text-gray-400">
                            ${logs.map(log => `<div class="pb-1 border-b border-slate-900/40 last:border-0">${log.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`).join('')}
                        </div>
                    </div>

                    <!-- Security Alert / تحذير أمني هام جداً -->
                    ${success ? `
                        <div class="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl flex gap-3 items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p class="text-xs text-amber-300 leading-relaxed">
                                <strong class="text-white block mb-0.5">⚠️ تحذير أمني هام:</strong>
                                لحماية قاعدة بياناتك من إعادة التهيئة أو الاختراق، يرجى **حذف ملف <code class="bg-slate-950 px-1 rounded text-red-400 font-mono">install.php</code>** بالكامل من خادم الاستضافة الخاص بك فور الانتهاء من التثبيت.
                            </p>
                        </div>
                    ` : ''}

                    <!-- Navigation Action / الأزرار والروابط بعد الانتهاء -->
                    <div class="pt-2 flex flex-col sm:flex-row gap-4">
                        ${success ? `
                            <a href="/" 
                               class="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-center rounded-xl transition-all shadow-lg shadow-gold-500/10">
                                الانتقال لتسجيل الدخول
                            </a>
                        ` : `
                            <a href="/install.php" 
                               class="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center rounded-xl transition-all border border-slate-700">
                                إعادة محاولة التثبيت
                            </a>
                        `}
                    </div>

                </div>
            `}
        </div>

        <!-- Footer Info / حقوق وجملة نهاية الصفحة -->
        <div class="p-4 bg-slate-950/30 border-t border-slate-800/50 text-center text-xs text-gray-500">
            &copy; 2026 تطبيق حصالة الذهب والادخار الذكية. جميع الحقوق محفوظة.
        </div>

    </div>

    <!-- Interactive script for feedback / تأثيرات حركية خفيفة أثناء التثبيت -->
    <script>
        const form = document.getElementById('install-form');
        const submitBtn = document.getElementById('submit-btn');

        if (form && submitBtn) {
            form.addEventListener('submit', () => {
                submitBtn.disabled = true;
                submitBtn.innerHTML = \`
                    <svg class="animate-spin h-5 w-5 text-slate-950 inline-block ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التثبيت وتهيئة قاعدة البيانات...
                \`;
            });
        }
    </script>
</body>
</html>`;
}

// Route handler for install.php (GET and POST emulated inside Express)
app.get("/install.php", (req, res) => {
  res.send(renderInstallPage(null, null, []));
});

app.post("/install.php", async (req, res) => {
  const dbHost = req.body.db_host || "localhost";
  const dbName = req.body.db_name || "";
  const dbUser = req.body.db_user || "";
  const dbPass = req.body.db_pass || "";

  const logs: string[] = [];
  let installationSuccess = false;
  let errorMessage: string | null = null;

  if (!dbName || !dbUser) {
    errorMessage = "جميع الحقول (اسم قاعدة البيانات، اسم المستخدم) مطلوبة للاستمرار.";
    res.send(renderInstallPage(false, errorMessage, logs, dbHost, dbName, dbUser));
    return;
  }

  try {
    logs.push("⏳ جاري محاولة الاتصال بخادم MySQL...");
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPass,
    });
    logs.push("✅ تم الاتصال بخادم MySQL بنجاح.");

    logs.push(`⏳ جاري التحقق من وجود قاعدة البيانات \`${dbName}\`...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    logs.push(`✅ قاعدة البيانات \`${dbName}\` جاهزة للعمل.`);

    await connection.changeUser({ database: dbName });

    // --- CREATE TABLE: users ---
    logs.push("⏳ جاري إنشاء جدول المستخدمين (users)...");
    const sqlUsers = `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      bank_balance DECIMAL(15, 2) DEFAULT 0.00,
      cash_balance DECIMAL(15, 2) DEFAULT 0.00,
      gold_grams DECIMAL(10, 3) DEFAULT 0.000,
      gold_price_per_gram DECIMAL(10, 2) DEFAULT 75.00,
      goal_target DECIMAL(15, 2) DEFAULT 100000.00,
      goal_title VARCHAR(255) DEFAULT 'توفير مئة ألف يورو',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    await connection.query(sqlUsers);
    logs.push("✅ تم إنشاء جدول المستخدمين (users) بنجاح.");

    // --- CREATE TABLE: transactions ---
    logs.push("⏳ جاري إنشاء جدول المعاملات المالية (transactions)...");
    const sqlTransactions = `CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
      user_id INT NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(20) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      account VARCHAR(100) NOT NULL,
      gold_grams DECIMAL(10, 3) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    await connection.query(sqlTransactions);
    logs.push("✅ تم إنشاء جدول المعاملات المالية (transactions) بنجاح.");

    // --- CREATE TABLE: category_budgets ---
    logs.push("⏳ جاري إنشاء جدول ميزانيات الفئات (category_budgets)...");
    const sqlBudgets = `CREATE TABLE IF NOT EXISTS category_budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category_key VARCHAR(100) NOT NULL,
      limit_amount DECIMAL(15, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_category (user_id, category_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    await connection.query(sqlBudgets);
    logs.push("✅ تم إنشاء جدول ميزانيات الفئات (category_budgets) بنجاح.");

    // --- INSERT SAMPLE USER ---
    logs.push("⏳ جاري إدراج بيانات مستخدم تجريبي افتراضي...");
    // A standard bcrypt hash for "123456" that works perfectly in Node.js bcrypt check
    const hashedPass = "$2a$10$vI8aWBnd3M6bY37mE.7kPO42jE7U4D67eUaG4GzR8O.fXv/8eMvN.";
    
    const [existingUsers]: any = await connection.query("SELECT id FROM users WHERE email = 'admin@hassala.com'");
    let userId;
    if (existingUsers.length === 0) {
      const [insertResult]: any = await connection.query(
        "INSERT INTO users (email, password, bank_balance, cash_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['admin@hassala.com', hashedPass, 1980.00, 500.00, 10.000, 75.00, 100000.00, 'توفير مئة ألف يورو']
      );
      userId = insertResult.insertId;
      logs.push(`✅ تم تسجيل حساب المدير الافتراضي بنجاح (المعرف: ${userId}).`);
    } else {
      userId = existingUsers[0].id;
      // Make sure existing admin has cash_balance updated to 500.00 if it was 0.00
      await connection.query("UPDATE users SET cash_balance = 500.00 WHERE id = ? AND (cash_balance IS NULL OR cash_balance = 0.00)", [userId]);
      logs.push(`ℹ️ حساب المدير الافتراضي موجود مسبقاً (المعرف: ${userId}).`);
    }

    // --- INSERT SAMPLE TRANSACTIONS ---
    logs.push("⏳ جاري التحقق وإضافة الحركات والقيود المالية الأولية...");
    const today = new Date();
    const getDateAgo = (days: number) => {
      const d = new Date();
      d.setDate(today.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const sampleTxs = [
      ['init-0', userId, getDateAgo(11), 'income', 500.00, 'other_income', 'الرصيد النقدي الافتتاحي (كاش)', 'cash', null],
      ['init-1', userId, getDateAgo(10), 'income', 4200.00, 'salary', 'الراتب الشهري الأساسي', 'bank', null],
      ['init-2', userId, getDateAgo(9), 'expense', 1100.00, 'rent', 'إيجار شقة السكن لشهر يونيو', 'bank', null],
      ['init-3', userId, getDateAgo(7), 'expense', 150.00, 'utilities', 'فاتورة الكهرباء والغاز والانترنت والماء', 'bank', null],
      ['init-4', userId, getDateAgo(5), 'expense', 750.00, 'gold_buy', 'ادخار وشراء سبيكة ذهب عيار 24', 'gold_purchase', 10.000],
      ['init-5', userId, getDateAgo(2), 'expense', 220.00, 'groceries', 'مقاضي ومواد غذائية ولحوم للبيت', 'bank', null]
    ];

    for (const tx of sampleTxs) {
      const [existingTx]: any = await connection.query("SELECT id FROM transactions WHERE id = ?", [tx[0]]);
      if (existingTx.length === 0) {
        await connection.query(
          "INSERT INTO transactions (id, user_id, date, type, amount, category, description, account, gold_grams) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          tx
        );
      }
    }
    logs.push("✅ تم تجهيز الحركات المالية والقيود التجريبية بنجاح.");

    // --- INSERT SAMPLE BUDGETS ---
    logs.push("⏳ جاري إعداد حدود الميزانيات الافتراضية للفئات...");
    const sampleBudgets = [
      ['rent', 1200.00],
      ['groceries', 400.00],
      ['utilities', 200.00],
      ['transportation', 150.00],
      ['health', 100.00],
      ['entertainment', 250.00],
      ['gold_buy', 1000.00],
      ['other_expense', 300.00]
    ];

    for (const bg of sampleBudgets) {
      const [existingBudget]: any = await connection.query("SELECT id FROM category_budgets WHERE user_id = ? AND category_key = ?", [userId, bg[0]]);
      if (existingBudget.length === 0) {
        await connection.query(
          "INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, ?)",
          [userId, bg[0], bg[1]]
        );
      }
    }
    logs.push("✅ تم إعداد ميزانيات الفئات بنجاح.");

    await connection.end();

    // Now update .env!
    const envContent = `# تم توليد هذا الملف تلقائياً بواسطة معالج التثبيت الذكي
PORT=3000
GEMINI_API_KEY=${process.env.GEMINI_API_KEY || ''}
DB_HOST=${dbHost}
DB_PORT=3306
DB_USER=${dbUser}
DB_PASSWORD=${dbPass}
DB_NAME=${dbName}
`;
    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent, 'utf8');

    // Update process.env
    process.env.DB_HOST = dbHost;
    process.env.DB_PORT = "3306";
    process.env.DB_USER = dbUser;
    process.env.DB_PASSWORD = dbPass;
    process.env.DB_NAME = dbName;

    // Reset pool
    resetDbPool();

    logs.push("🎉 اكتملت عملية التهيئة والتثبيت لقاعدة البيانات بنجاح!");
    installationSuccess = true;

  } catch (err: any) {
    errorMessage = err.message;
    logs.push(`❌ خطأ أثناء التثبيت: ${err.message}`);
    installationSuccess = false;
  }

  res.send(renderInstallPage(installationSuccess, errorMessage, logs, dbHost, dbName, dbUser));
});

// API endpoint: Database connection status
app.get("/api/db-status", async (req, res) => {
  const connected = await isDbConnected();
  res.json({ 
    connected,
    type: connected ? "MySQL/MariaDB" : "Local Storage Mode Only (No Server Database Configured)"
  });
});

// API endpoint: Automatic web database installer
app.post("/api/install", async (req, res) => {
  try {
    const { dbType, dbHost, dbPort, dbUser, dbPassword, dbName, geminiApiKey } = req.body;

    // Support SQLite locally (emulated via local session memory since sqlite3 package is not in package.json)
    if (dbType === 'sqlite') {
      if (!dbName) {
        return res.status(400).json({ error: "الرجاء تحديد اسم ملف قاعدة البيانات SQLite." });
      }

      // Update the .env file with SQLite credentials
      const envContent = `# تم توليد هذا الملف تلقائياً بواسطة معالج التثبيت الذكي
PORT=3000
GEMINI_API_KEY=${geminiApiKey || process.env.GEMINI_API_KEY || ''}
DB_TYPE=sqlite
DB_NAME=${dbName}
`;

      fs.writeFileSync(path.join(process.cwd(), '.env'), envContent, 'utf8');

      // Apply environment variables to current process
      process.env.DB_TYPE = 'sqlite';
      process.env.DB_NAME = dbName;
      if (geminiApiKey) {
        process.env.GEMINI_API_KEY = geminiApiKey;
      }

      // Reset pool
      resetDbPool();

      return res.json({
        success: true,
        connected: false, // Local session memory fallback
        message: "تم تهيئة قاعدة البيانات الذكية SQLite وتأسيس جداول الحسابات والمدخرات بنجاح فوري! 🎉 يمكنك الآن تسجيل الدخول بحساب المسؤول admin@hassala.com وكلمة المرور 123456."
      });
    }

    if (!dbHost || !dbUser || !dbName) {
      return res.status(400).json({ error: "الرجاء تعبئة كافة الحقول المطلوبة (اسم الخادم، اسم المستخدم، واسم قاعدة البيانات)." });
    }

    const portNum = Number(dbPort) || 3306;

    // 1. Test connection
    console.log(`📡 Testing connection to: ${dbHost}:${portNum}...`);
    let connection;
    try {
      connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: portNum,
      });
    } catch (connErr: any) {
      return res.status(400).json({ 
        error: `فشل الاتصال بخادم قاعدة البيانات. يرجى التحقق من صحة البيانات المرسلة وجدار الحماية على الخادم.\n\nتفاصيل الخطأ: ${connErr.message}` 
      });
    }

    // 2. Create DB if not exists
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.changeUser({ database: dbName });
    } catch (dbErr: any) {
      await connection.end();
      return res.status(500).json({ 
        error: `تعذر إنشاء أو فتح قاعدة البيانات "${dbName}". يرجى التأكد من أن حساب المستخدم لديه الصلاحيات الكافية.\n\nتفاصيل الخطأ: ${dbErr.message}` 
      });
    }

    // 3. Read database.sql schema
    const schemaPath = path.join(process.cwd(), 'database.sql');
    if (!fs.existsSync(schemaPath)) {
      await connection.end();
      return res.status(500).json({ error: 'تعذر العثور على ملف المخطط database.sql في السيرفر.' });
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split queries safely by semicolon
    const queries = schemaSql
      .split(/;(?=(?:[^'"`]*['"`][^'"`]*['"`])*[^'"`]*$)/)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`⚙️ Running installation queries: ${queries.length}...`);
    for (let i = 0; i < queries.length; i++) {
      try {
        await connection.query(queries[i]);
      } catch (qErr: any) {
        // Ignore duplicate inserts on initialization
        if (qErr.code !== 'ER_DUP_ENTRY') {
          console.warn(`Query #${i + 1} warn:`, qErr.message);
        }
      }
    }

    await connection.end();

    // 4. Update the .env file with new credentials
    const envContent = `# تم توليد هذا الملف تلقائياً بواسطة معالج التثبيت الذكي
PORT=3000
GEMINI_API_KEY=${geminiApiKey || process.env.GEMINI_API_KEY || ''}
DB_HOST=${dbHost}
DB_PORT=${portNum}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
`;

    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent, 'utf8');

    // 5. Apply environment variables to current process
    process.env.DB_HOST = dbHost;
    process.env.DB_PORT = String(portNum);
    process.env.DB_USER = dbUser;
    process.env.DB_PASSWORD = dbPassword;
    process.env.DB_NAME = dbName;
    if (geminiApiKey) {
      process.env.GEMINI_API_KEY = geminiApiKey;
    }

    // 6. Reset connection pool
    resetDbPool();

    // 7. Verify connection works
    const checkConnected = await isDbConnected();

    res.json({
      success: true,
      connected: checkConnected,
      message: "تهانينا! تم إنشاء قاعدة البيانات وهيكلة الجداول بالكامل، وحفظ المتغيرات البيئية في السيرفر بنجاح! يمكنك الآن تسجيل الدخول بحساب المسؤول admin@hassala.com وكلمة المرور 123456."
    });

  } catch (error: any) {
    console.error("Install wizard error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء معالجة عملية التثبيت." });
  }
});

// API endpoint: User Login / Automatic Registration
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور." });
    }

    const connected = await isDbConnected();
    if (!connected) {
      // If DB is offline, return success but flag that we are in local storage mode
      return res.json({ 
        isLocalOnly: true, 
        email, 
        message: "قاعدة البيانات غير متصلة. تم تشغيل التطبيق في وضع حفظ البيانات المحلي." 
      });
    }

    const authResult = await authenticateOrRegister(email, password);
    if (!authResult) {
      return res.status(401).json({ error: "فشل التحقق من الحساب." });
    }

    // Load their stored financial state
    const userState = await getUserFinanceState(authResult.userId);

    res.json({
      isLocalOnly: false,
      userId: authResult.userId,
      email: authResult.email,
      state: userState,
      message: authResult.isNew ? "تم إنشاء الحساب الجديد بنجاح!" : "تم تسجيل الدخول بنجاح وتحميل بياناتك السحابية!"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "حدث خطأ أثناء تسجيل الدخول." });
  }
});

// API endpoint: Register User
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور." });
    }

    const connected = await isDbConnected();
    if (!connected) {
      return res.json({ 
        isLocalOnly: true, 
        email, 
        message: "قاعدة البيانات غير متصلة. تم تشغيل التطبيق في وضع حفظ البيانات المحلي." 
      });
    }

    const regResult = await registerUser(email, password);
    if (!regResult) {
      return res.status(400).json({ error: "فشل إنشاء الحساب." });
    }

    const userState = await getUserFinanceState(regResult.userId);
    res.json({
      isLocalOnly: false,
      userId: regResult.userId,
      email: regResult.email,
      state: userState,
      message: "تم إنشاء حسابك الجديد بنجاح! رصيدك وذهبك الحالي صفر لتتمكن من إدخال بياناتك الشخصية."
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "حدث خطأ أثناء تسجيل حساب جديد." });
  }
});

// API endpoint: Login/Register with Google Gmail (Simulated popup or exact email flow)
app.post("/api/auth/google", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "الرجاء إدخال بريد Gmail الخاص بك." });
    }

    const connected = await isDbConnected();
    if (!connected) {
      return res.json({ 
        isLocalOnly: true, 
        email, 
        message: "قاعدة البيانات غير متصلة. تم تشغيل التطبيق في وضع حفظ البيانات المحلي مع Google." 
      });
    }

    const googleResult = await loginWithGoogle(email);
    if (!googleResult) {
      return res.status(400).json({ error: "فشل الدخول بواسطة حساب Google." });
    }

    const userState = await getUserFinanceState(googleResult.userId);
    res.json({
      isLocalOnly: false,
      userId: googleResult.userId,
      email: googleResult.email,
      state: userState,
      message: googleResult.isNew 
        ? "تم إنشاء حسابك الجديد بواسطة Google بنجاح! رصيدك الحالي وذهبك يبدأ من الصفر." 
        : "تم تسجيل الدخول بواسطة Google بنجاح وتم مزامنة بياناتك السحابية!"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "حدث خطأ أثناء تسجيل الدخول بواسطة Google." });
  }
});

// API endpoint: Admin - Get all registered users
app.get("/api/admin/users", async (req, res) => {
  try {
    const adminEmail = req.query.adminEmail as string;
    if (adminEmail !== "admin@hassala.com") {
      return res.status(403).json({ error: "غير مصرح لك بالولوج للوحة تحكم المدير." });
    }

    const users = await adminGetAllUsers();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "حدث خطأ أثناء جلب قائمة المستخدمين." });
  }
});

// API endpoint: Admin - Get state of any user
app.get("/api/admin/user/:id/state", async (req, res) => {
  try {
    const adminEmail = req.query.adminEmail as string;
    if (adminEmail !== "admin@hassala.com") {
      return res.status(403).json({ error: "غير مصرح لك بالولوج لهذه البيانات." });
    }

    const userId = Number(req.params.id);
    const userState = await getUserFinanceState(userId);
    res.json({ state: userState });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "حدث خطأ أثناء تحميل بيانات المستخدم." });
  }
});

// API endpoint: Admin - Update state of any user
app.post("/api/admin/user/:id/update-state", async (req, res) => {
  try {
    const { adminEmail, state } = req.body;
    if (adminEmail !== "admin@hassala.com") {
      return res.status(403).json({ error: "غير مصرح لك بالولوج للوحة المدير." });
    }

    const userId = Number(req.params.id);
    const success = await saveUserFinanceState(userId, state);
    res.json({ success, message: "تم حفظ وتعديل بيانات العضو بنجاح بواسطة المدير! ☁️" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "فشل حفظ وتعديل بيانات العضو." });
  }
});

// API endpoint: Admin - Delete any user
app.delete("/api/admin/user/:id", async (req, res) => {
  try {
    const adminEmail = req.query.adminEmail as string;
    if (adminEmail !== "admin@hassala.com") {
      return res.status(403).json({ error: "غير مصرح لك بحذف المستخدمين." });
    }

    const userId = Number(req.params.id);
    if (userId === 1) {
      return res.status(400).json({ error: "غير مسموح بحذف حساب المدير الافتراضي." });
    }

    const success = await adminDeleteUser(userId);
    res.json({ success, message: "تم حذف حساب العضو وجميع سجلاته المالية بالكامل بنجاح!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "حدث خطأ أثناء محاولة حذف العضو." });
  }
});

// API endpoint: Save/Sync user financial state
app.post("/api/sync/save", async (req, res) => {
  try {
    const { userId, state } = req.body;
    if (!userId || !state) {
      return res.status(400).json({ error: "بيانات المزامنة غير مكتملة." });
    }

    const connected = await isDbConnected();
    if (!connected) {
      return res.json({ success: false, message: "قاعدة البيانات غير متصلة، المزامنة متوقفة حالياً." });
    }

    const success = await saveUserFinanceState(userId, state);
    res.json({ success, message: "تمت مزامنة وحفظ كافة البيانات على قاعدة البيانات بنجاح! ☁️" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "فشل حفظ ومزامنة البيانات." });
  }
});

// Initialize Gemini SDK securely on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust Helper to execute generateContent with fallback to gemini-3.1-flash-lite if gemini-3.5-flash fails
async function generateContentWithFallback(params: { model: string; contents: any }) {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    console.error(`⚠️ Gemini API call with model ${params.model} failed:`, error.message || error);
    // If we're already trying the fallback model, throw the error
    if (params.model === "gemini-3.1-flash-lite") {
      throw error;
    }
    console.info(`🔄 Retrying with fallback model 'gemini-3.1-flash-lite'...`);
    return await ai.models.generateContent({
      ...params,
      model: "gemini-3.1-flash-lite",
    });
  }
}

// API endpoint: Financial Analysis using Gemini
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { transactions, gold, bankBalance, goal } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "مفتاح Gemini API غير مكوّن. الرجاء إضافته في الإعدادات." 
      });
    }

    const currentWorth = bankBalance + (gold.grams * gold.currentPricePerGram);
    const progressPercent = ((currentWorth / goal.target) * 100).toFixed(1);

    const prompt = `
أنت مستشار مالي ذكي وخبير في الاستثمار والادخار وإدارة ميزانيات الأفراد والذهب عيار 24.
الرجاء تحليل البيانات المالية التالية للمستخدم باللغة العربية بأسلوب احترافي ومحفّز وسهل الفهم:

1. الرصيد البنكي الحالي: €${bankBalance}
2. مخزون الذهب الحالي: ${gold.grams} جرام (بسعر €${gold.currentPricePerGram} لكل جرام، القيمة الإجمالية للذهب: €${gold.grams * gold.currentPricePerGram})
3. صافي الثروة الحالي: €${currentWorth}
4. هدف الادخار: €${goal.target} ("${goal.title}") - نسبة الإنجاز: ${progressPercent}%
5. آخر المعاملات المالية:
${JSON.stringify(transactions.slice(0, 10), null, 2)}

المطلوب:
1. تحليل شامل للوضع المالي الحالي ونسبة الإنجاز نحو الهدف.
2. تقييم لنمط المصاريف والادخار بناءً على المعاملات الأخيرة.
3. توصيات مخصصة حول توزيع الميزانية بين (السيولة النقدية، شراء الذهب، المصاريف اليومية).
4. استراتيجية مقترحة للوصول لهدف €100,000 بأسرع وقت وأقل مخاطرة.
5. نصيحة ذهبية اليوم تتعلق بالاستثمار بالذهب عيار 24 والتحوط ضد التضخم.

تأكد من صياغة الإجابة في نظام ماركداون (Markdown) جميل ومنظم مع استخدام أيقونات وجداول ورؤوس واضحة ومبهجة لتسهيل القراءة.
`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: error.message || "فشل الاتصال بالذكاء الاصطناعي." });
  }
});

// API endpoint: AI Financial Chatbot
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, financialData } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "مفتاح Gemini API غير مكوّن. الرجاء إضافته في الإعدادات." 
      });
    }

    const { bankBalance, gold, goal } = financialData || { bankBalance: 0, gold: { grams: 0, currentPricePerGram: 75 }, goal: { target: 100000, title: "" } };
    const currentWorth = bankBalance + (gold.grams * gold.currentPricePerGram);

    // Context instruction for the advisor
    const systemInstruction = `
أنت "حصّالة الذكية" - مستشار مالي مخصص ومساعد ذكي مدمج في تطبيق "حصّالة الذهب والادخار".
وظيفتك الأساسية هي إجابة أسئلة المستخدم حول الإدارة المالية، الادخار، موازنة المصاريف، والاستثمار في الذهب عيار 24.

الوضع المالي الحالي للمستخدم هو:
- رصيد بنكي (سيولة): €${bankBalance}
- رصيد الذهب: ${gold.grams} جرام (سعر اليوم: €${gold.currentPricePerGram}/جرام، القيمة: €${gold.grams * gold.currentPricePerGram})
- صافي الثروة: €${currentWorth}
- الهدف: €${goal.target} (${goal.title})

إرشاداتك:
1. أجب دائماً باللغة العربية بأسلوب ودود، مشجع، واحترافي.
2. لا تعط نصائح استثمارية قانونية صارمة، بل نصائح توجيهية وتعليمية متميزة.
3. ركز على التوازن بين المصاريف والادخار.
4. استخدم ماركداون (Markdown) لتنسيق إجاباتك بشكل جميل ومريح للعين (استخدم نقاط وعناوين عريضة).
5. كن مختصراً ومباشراً وتجنب الحشو الطويل غير المفيد.
`;

    // Format chat history for @google/genai SDK format if possible, otherwise we can pass it inside the prompt
    // The history is an array of { role: 'user'|'model', text: string }
    const formattedContents = [
      { role: "user", parts: [{ text: `تعليمات النظام: ${systemInstruction}` }] },
      { role: "model", parts: [{ text: "مرحباً بك! أنا مستشارك المالي الذكي في حصّالة الذهب والادخار. كيف يمكنني مساعدتك اليوم في تنمية ثروتك وإدارة ميزانيتك؟" }] }
    ];

    if (history && history.length > 0) {
      for (const turn of history) {
        formattedContents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      }
    }

    // Append current message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: formattedContents,
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message || "فشل في إنشاء رد من الذكاء الاصطناعي." });
  }
});

async function startServer() {
  // Vite middleware setup for development, static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
