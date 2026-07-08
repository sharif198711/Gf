<?php
/**
 * Hassala Gold & Saving App - Installer Script
 * حصالة الذهب والادخار - ملف تثبيت قاعدة البيانات
 * Created At: 2026-07-01
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$installation_success = null;
$error_message = null;
$logs = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db_host = isset($_POST['db_host']) ? trim($_POST['db_host']) : 'localhost';
    $db_name = isset($_POST['db_name']) ? trim($_POST['db_name']) : '';
    $db_user = isset($_POST['db_user']) ? trim($_POST['db_user']) : '';
    $db_pass = isset($_POST['db_pass']) ? trim($_POST['db_pass']) : '';

    if (empty($db_name) || empty($db_user)) {
        $error_message = "جميع الحقول (اسم قاعدة البيانات، اسم المستخدم) مطلوبة للاستمرار.";
    } else {
        try {
            $logs[] = "⏳ جاري محاولة الاتصال بخادم MySQL...";
            
            // Connect to server (without DB first, in case we need to create it)
            $dsn_no_db = "mysql:host={$db_host};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $pdo = new PDO($dsn_no_db, $db_user, $db_pass, $options);
            $logs[] = "✅ تم الاتصال بخادم MySQL بنجاح.";

            // Try creating the database if it doesn't exist
            $logs[] = "⏳ جاري التحقق من وجود قاعدة البيانات `{$db_name}`...";
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $logs[] = "✅ قاعدة البيانات `{$db_name}` جاهزة للعمل.";

            // Re-connect to the specific database
            $pdo->exec("USE `{$db_name}`");

            // --- CREATE TABLE: users ---
            $logs[] = "⏳ جاري إنشاء جدول المستخدمين (users)...";
            $sql_users = "CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                bank_balance DECIMAL(15, 2) DEFAULT 0.00,
                gold_grams DECIMAL(10, 3) DEFAULT 0.000,
                gold_price_per_gram DECIMAL(10, 2) DEFAULT 75.00,
                goal_target DECIMAL(15, 2) DEFAULT 100000.00,
                goal_title VARCHAR(255) DEFAULT 'توفير مئة ألف يورو',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            $pdo->exec($sql_users);
            $logs[] = "✅ تم إنشاء جدول المستخدمين (users) بنجاح.";

            // --- CREATE TABLE: transactions ---
            $logs[] = "⏳ جاري إنشاء جدول المعاملات المالية (transactions)...";
            $sql_transactions = "CREATE TABLE IF NOT EXISTS transactions (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            $pdo->exec($sql_transactions);
            $logs[] = "✅ تم إنشاء جدول المعاملات المالية (transactions) بنجاح.";

            // --- CREATE TABLE: category_budgets ---
            $logs[] = "⏳ جاري إنشاء جدول ميزانيات الفئات (category_budgets)...";
            $sql_budgets = "CREATE TABLE IF NOT EXISTS category_budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category_key VARCHAR(100) NOT NULL,
                limit_amount DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_category (user_id, category_key),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            $pdo->exec($sql_budgets);
            $logs[] = "✅ تم إنشاء جدول ميزانيات الفئات (category_budgets) بنجاح.";

            // --- INSERT SAMPLE USER: admin@hassala.com ---
            $logs[] = "⏳ جاري إدراج بيانات مستخدم تجريبي افتراضي...";
            $hashed_password = password_hash('123456', PASSWORD_DEFAULT); // standard bcrypt
            
            // We use simple INSERT with check or ON DUPLICATE KEY to avoid crash
            $stmt_check_user = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt_check_user->execute(['admin@hassala.com']);
            $existing_user = $stmt_check_user->fetch();

            if (!$existing_user) {
                $stmt_insert_user = $pdo->prepare("INSERT INTO users (email, password, bank_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt_insert_user->execute([
                    'admin@hassala.com',
                    $hashed_password,
                    1980.00,
                    10.000,
                    75.00,
                    100000.00,
                    'توفير مئة ألف يورو'
                ]);
                $user_id = $pdo->lastInsertId();
                $logs[] = "✅ تم تسجيل حساب المدير الافتراضي بنجاح (المعرف: {$user_id}).";
            } else {
                $user_id = $existing_user['id'];
                $logs[] = "ℹ️ حساب المدير الافتراضي موجود مسبقاً (المعرف: {$user_id}).";
            }

            // --- INSERT SAMPLE TRANSACTIONS ---
            $logs[] = "⏳ جاري التحقق وإضافة الحركات والقيود المالية الأولية...";
            $sample_txs = [
                ['init-1', $user_id, date('Y-m-d', strtotime('-10 days')), 'income', 4200.00, 'salary', 'الراتب الشهري الأساسي', 'bank', null],
                ['init-2', $user_id, date('Y-m-d', strtotime('-9 days')), 'expense', 1100.00, 'rent', 'إيجار شقة السكن لشهر يونيو', 'bank', null],
                ['init-3', $user_id, date('Y-m-d', strtotime('-7 days')), 'expense', 150.00, 'utilities', 'فاتورة الكهرباء والغاز والانترنت والماء', 'bank', null],
                ['init-4', $user_id, date('Y-m-d', strtotime('-5 days')), 'expense', 750.00, 'gold_buy', 'ادخار وشراء سبيكة ذهب عيار 24', 'gold_purchase', 10.000],
                ['init-5', $user_id, date('Y-m-d', strtotime('-2 days')), 'expense', 220.00, 'groceries', 'مقاضي ومواد غذائية ولحوم للبيت', 'bank', null]
            ];

            $stmt_tx_check = $pdo->prepare("SELECT id FROM transactions WHERE id = ?");
            $stmt_tx_insert = $pdo->prepare("INSERT INTO transactions (id, user_id, date, type, amount, category, description, account, gold_grams) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($sample_txs as $tx) {
                $stmt_tx_check->execute([$tx[0]]);
                if (!$stmt_tx_check->fetch()) {
                    $stmt_tx_insert->execute($tx);
                }
            }
            $logs[] = "✅ تم تجهيز الحركات المالية والقيود التجريبية بنجاح.";

            // --- INSERT SAMPLE BUDGETS ---
            $logs[] = "⏳ جاري إعداد حدود الميزانيات الافتراضية للفئات...";
            $sample_budgets = [
                ['rent', 1200.00],
                ['groceries', 400.00],
                ['utilities', 200.00],
                ['transportation', 150.00],
                ['health', 100.00],
                ['entertainment', 250.00],
                ['gold_buy', 1000.00],
                ['other_expense', 300.00]
            ];

            $stmt_budget_check = $pdo->prepare("SELECT id FROM category_budgets WHERE user_id = ? AND category_key = ?");
            $stmt_budget_insert = $pdo->prepare("INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, ?)");

            foreach ($sample_budgets as $bg) {
                $stmt_budget_check->execute([$user_id, $bg[0]]);
                if (!$stmt_budget_check->fetch()) {
                    $stmt_budget_insert->execute([$user_id, $bg[0], $bg[1]]);
                }
            }
            $logs[] = "✅ تم إعداد ميزانيات الفئات بنجاح.";
            $logs[] = "🎉 اكتملت عملية التهيئة والتثبيت لقاعدة البيانات بنجاح!";

            // Save configuration for api.php to read
            $db_config_code = "<?php\n"
                . "// تم توليد هذا الملف تلقائياً بواسطة معالج التثبيت\n"
                . "define('DB_HOST', '" . addslashes($db_host) . "');\n"
                . "define('DB_NAME', '" . addslashes($db_name) . "');\n"
                . "define('DB_USER', '" . addslashes($db_user) . "');\n"
                . "define('DB_PASS', '" . addslashes($db_pass) . "');\n"
                . "define('GEMINI_API_KEY', ''); // يمكنك وضع مفتاح Gemini هنا لتشغيل الذكاء الاصطناعي\n";
            file_put_contents('db_config.php', $db_config_code);
            $logs[] = "✅ تم حفظ إعدادات الاتصال في ملف `db_config.php` بنجاح لتشغيل الـ API في الاستضافة.";

            $installation_success = true;

        } catch (PDOException $e) {
            $error_message = $e->getMessage();
            $logs[] = "❌ خطأ أثناء التثبيت: " . $e->getMessage();
            $installation_success = false;
        }
    }
}
?>
<!DOCTYPE html>
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
<body class="min-h-screen text-gray-200 py-12 px-4 flex items-center justify-center">

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
            
            <?php if ($installation_success === null): ?>
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
                            <input type="text" id="db_host" name="db_host" value="localhost" required 
                                   class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all placeholder:text-gray-600">
                            <p class="text-xs text-gray-500">غالباً ما يكون <code class="bg-slate-950 px-1 py-0.5 rounded text-gold-400">localhost</code> في معظم الاستضافات.</p>
                        </div>

                        <!-- Database Name -->
                        <div class="space-y-2">
                            <label for="db_name" class="block text-sm font-medium text-gray-300">اسم قاعدة البيانات (Database Name)</label>
                            <input type="text" id="db_name" name="db_name" placeholder="مثال: hassala_db" required 
                                   class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all placeholder:text-gray-600">
                            <p class="text-xs text-gray-500">اسم قاعدة البيانات الفارغة التي تم إنشاؤها من لوحة التحكم.</p>
                        </div>

                        <!-- DB Username -->
                        <div class="space-y-2">
                            <label for="db_user" class="block text-sm font-medium text-gray-300">اسم مستخدم قاعدة البيانات (Username)</label>
                            <input type="text" id="db_user" name="db_user" placeholder="مثال: hassala_user" required 
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

            <?php else: ?>
                <!-- Result Screen / شاشة النتائج والتقرير -->
                <div class="space-y-6">
                    
                    <?php if ($installation_success): ?>
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
                    <?php else: ?>
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
                            </div>
                        </div>
                    <?php endif; ?>

                    <!-- Action Logs / سجل العمليات التفصيلي -->
                    <div class="space-y-2">
                        <span class="text-xs font-medium text-gray-400 block px-1">تقرير وسجل العمليات (Installation Log):</span>
                        <div class="p-4 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs space-y-2 overflow-y-auto max-h-60 leading-relaxed text-gray-400">
                            <?php foreach ($logs as $log): ?>
                                <div class="pb-1 border-b border-slate-900/40 last:border-0"><?= htmlspecialchars($log) ?></div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- Security Alert / تحذير أمني هام جداً -->
                    <?php if ($installation_success): ?>
                        <div class="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl flex gap-3 items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p class="text-xs text-amber-300 leading-relaxed">
                                <strong class="text-white block mb-0.5">⚠️ تحذير أمني هام:</strong>
                                لحماية قاعدة بياناتك من إعادة التهيئة أو الاختراق، يرجى **حذف ملف <code class="bg-slate-950 px-1 rounded text-red-400 font-mono">install.php</code>** بالكامل من خادم الاستضافة الخاص بك فور الانتهاء من التثبيت.
                            </p>
                        </div>
                    <?php endif; ?>

                    <!-- Navigation Action / الأزرار والروابط بعد الانتهاء -->
                    <div class="pt-2 flex flex-col sm:flex-row gap-4">
                        <?php if ($installation_success): ?>
                            <a href="/" 
                               class="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-center rounded-xl transition-all shadow-lg shadow-gold-500/10">
                                الانتقال لتسجيل الدخول
                            </a>
                        <?php else: ?>
                            <a href="install.php" 
                               class="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center rounded-xl transition-all border border-slate-700">
                                إعادة محاولة التثبيت
                            </a>
                        <?php endif; ?>
                    </div>

                </div>
            <?php endif; ?>

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
                submitBtn.innerHTML = `
                    <svg class="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التثبيت وتهيئة قاعدة البيانات...
                `;
            });
        }
    </script>
</body>
</html>
