<?php
/**
 * Hassala Gold & Saving App - PHP API Backend Bridge
 * حصالة الذهب والادخار - واجهة برمجية متكاملة لبيئة الاستضافة المشتركة (Hostinger)
 * Created At: 2026-07-08
 */

// Allow CORS if needed
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ensure error reporting is clean for JSON responses
error_reporting(0);
ini_set('display_errors', 0);

$db_connected = false;
$pdo = null;

// Try to load db_config.php if it exists
if (file_exists(__DIR__ . '/db_config.php')) {
    try {
        require_once __DIR__ . '/db_config.php';
        
        if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER')) {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            $db_connected = true;

            // Dynamically add cash_balance column to users table if it doesn't exist
            try {
                $pdo->exec("ALTER TABLE users ADD COLUMN cash_balance DECIMAL(15, 2) DEFAULT 0.00");
            } catch (PDOException $e) {
                // Column already exists or table doesn't exist yet, ignore
            }
        }
    } catch (PDOException $e) {
        $db_connected = false;
        $db_error = $e->getMessage();
    }
}

// Parse request route
$route = isset($_GET['route']) ? trim($_GET['route'], '/') : '';

// Helper to load user state from DB
function getUserFinanceState($pdo, $userId) {
    // 1. Core Info
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) return null;

    // 2. Transactions
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC");
    $stmt->execute([$userId]);
    $txRows = $stmt->fetchAll();
    
    $transactions = [];
    foreach ($txRows as $row) {
        $transactions[] = [
            'id' => $row['id'],
            'date' => $row['date'],
            'type' => $row['type'],
            'amount' => (float)$row['amount'],
            'category' => $row['category'],
            'description' => $row['description'],
            'account' => $row['account'],
            'goldGrams' => $row['gold_grams'] !== null ? (float)$row['gold_grams'] : null
        ];
    }

    // 3. Category Budgets
    $stmt = $pdo->prepare("SELECT * FROM category_budgets WHERE user_id = ?");
    $stmt->execute([$userId]);
    $budgetRows = $stmt->fetchAll();
    
    $categoryBudgets = [];
    foreach ($budgetRows as $row) {
        $categoryBudgets[$row['category_key']] = (float)$row['limit_amount'];
    }

    return [
        'bankBalance' => (float)$user['bank_balance'],
        'cashBalance' => isset($user['cash_balance']) ? (float)$user['cash_balance'] : 0.00,
        'gold' => [
            'grams' => (float)$user['gold_grams'],
            'currentPricePerGram' => (float)$user['gold_price_per_gram']
        ],
        'goal' => [
            'target' => (float)$user['goal_target'],
            'title' => $user['goal_title']
        ],
        'categoryBudgets' => $categoryBudgets,
        'transactions' => $transactions
    ];
}

// Helper to save user state to DB
function saveUserFinanceState($pdo, $userId, $state) {
    try {
        $pdo->beginTransaction();

        // 1. Update Core User Details
        $stmt = $pdo->prepare("UPDATE users SET bank_balance = ?, cash_balance = ?, gold_grams = ?, gold_price_per_gram = ?, goal_target = ?, goal_title = ? WHERE id = ?");
        $stmt->execute([
            $state['bankBalance'],
            isset($state['cashBalance']) ? $state['cashBalance'] : 0.00,
            $state['gold']['grams'],
            $state['gold']['currentPricePerGram'],
            $state['goal']['target'],
            $state['goal']['title'],
            $userId
        ]);

        // 2. Replace Transactions (delete and insert)
        $stmt = $pdo->prepare("DELETE FROM transactions WHERE user_id = ?");
        $stmt->execute([$userId]);

        if (isset($state['transactions']) && is_array($state['transactions']) && count($state['transactions']) > 0) {
            $sql = "INSERT INTO transactions (id, user_id, date, type, amount, category, description, account, gold_grams) VALUES ";
            $placeholders = [];
            $values = [];
            
            foreach ($state['transactions'] as $tx) {
                $placeholders[] = "(?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $values[] = $tx['id'];
                $values[] = $userId;
                $values[] = $tx['date'];
                $values[] = $tx['type'];
                $values[] = $tx['amount'];
                $values[] = $tx['category'];
                $values[] = isset($tx['description']) ? $tx['description'] : '';
                $values[] = $tx['account'];
                $values[] = isset($tx['goldGrams']) && $tx['goldGrams'] !== null ? $tx['goldGrams'] : null;
            }
            
            $sql .= implode(', ', $placeholders);
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
        }

        // 3. Replace Budgets (delete and insert)
        $stmt = $pdo->prepare("DELETE FROM category_budgets WHERE user_id = ?");
        $stmt->execute([$userId]);

        if (isset($state['categoryBudgets']) && is_array($state['categoryBudgets'])) {
            $stmtInsert = $pdo->prepare("INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, ?)");
            foreach ($state['categoryBudgets'] as $key => $limit) {
                $stmtInsert->execute([$userId, $key, $limit]);
            }
        }

        $pdo->commit();
        return true;
    } catch (Exception $e) {
        $pdo->rollBack();
        return false;
    }
}

// ---------------------------------------------------------
// ROUTE: DB STATUS
// ---------------------------------------------------------
if ($route === 'db-status') {
    echo json_encode([
        'connected' => $db_connected,
        'type' => $db_connected ? "MySQL/MariaDB (Hostinger)" : "Local Storage Mode Only (No Server Database Configured)",
        'message' => $db_connected ? "تم الاتصال بقاعدة البيانات بنجاح!" : (isset($db_error) ? "خطأ اتصال: $db_error" : "ملف الإعدادات db_config.php غير موجود. يرجى تشغيل install.php أولاً.")
    ]);
    exit;
}

// Read raw JSON input
$input_data = json_decode(file_get_contents('php://input'), true);

// Fallback behavior if database is offline or not configured
if (!$db_connected) {
    if (in_array($route, ['auth/login', 'auth/register', 'auth/google'])) {
        $email = isset($input_data['email']) ? $input_data['email'] : 'local@hassala.com';
        echo json_encode([
            'isLocalOnly' => true,
            'email' => $email,
            'message' => "قاعدة البيانات غير متصلة. تم تشغيل التطبيق في وضع حفظ البيانات المحلي على جهازك بأمان."
        ]);
        exit;
    }
    
    if ($route === 'sync/save') {
        echo json_encode([
            'success' => false,
            'message' => "قاعدة البيانات غير متصلة، المزامنة متوقفة حالياً. تم حفظ البيانات في المتصفح فقط."
        ]);
        exit;
    }
}

// ---------------------------------------------------------
// ROUTE: REGISTER
// ---------------------------------------------------------
if ($route === 'auth/register') {
    $email = trim($input_data['email'] ?? '');
    $password = $input_data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "الرجاء إدخال البريد الإلكتروني وكلمة المرور."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول."]);
            exit;
        }

        // Insert user
        $stmt = $pdo->prepare("INSERT INTO users (email, password, bank_balance, cash_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, ?, 0.00, 0.00, 0.000, 75.00, 100000.00, 'توفير مئة ألف يورو')");
        $stmt->execute([$email, $password]);
        $userId = $pdo->lastInsertId();

        // Seed budgets
        $defaultBudgets = [
            'rent' => 0.00, 'groceries' => 0.00, 'utilities' => 0.00, 'transportation' => 0.00,
            'health' => 0.00, 'entertainment' => 0.00, 'gold_buy' => 0.00, 'other_expense' => 0.00
        ];
        $stmtInsert = $pdo->prepare("INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, 0.00)");
        foreach ($defaultBudgets as $key => $limit) {
            $stmtInsert->execute([$userId, $key]);
        }

        $userState = getUserFinanceState($pdo, $userId);
        echo json_encode([
            'isLocalOnly' => false,
            'userId' => (int)$userId,
            'email' => $email,
            'state' => $userState,
            'message' => "تم إنشاء حسابك الجديد بنجاح! رصيدك وذهبك الحالي صفر لتتمكن من إدخال بياناتك الشخصية."
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// ---------------------------------------------------------
// ROUTE: LOGIN (Auto registers if not exists)
// ---------------------------------------------------------
if ($route === 'auth/login') {
    $email = trim($input_data['email'] ?? '');
    $password = $input_data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "الرجاء إدخال البريد الإلكتروني وكلمة المرور."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            if ($user['password'] !== $password) {
                http_response_code(401);
                echo json_encode(["error" => "كلمة المرور غير صحيحة لهذا الحساب."]);
                exit;
            }
            $userId = $user['id'];
            $isNew = false;
        } else {
            // Auto Register
            $stmt = $pdo->prepare("INSERT INTO users (email, password, bank_balance, cash_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, ?, 0.00, 0.00, 0.000, 75.00, 100000.00, 'توفير مئة ألف يورو')");
            $stmt->execute([$email, $password]);
            $userId = $pdo->lastInsertId();

            $defaultBudgets = [
                'rent' => 0.00, 'groceries' => 0.00, 'utilities' => 0.00, 'transportation' => 0.00,
                'health' => 0.00, 'entertainment' => 0.00, 'gold_buy' => 0.00, 'other_expense' => 0.00
            ];
            $stmtInsert = $pdo->prepare("INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, 0.00)");
            foreach ($defaultBudgets as $key => $limit) {
                $stmtInsert->execute([$userId, $key]);
            }
            $isNew = true;
        }

        $userState = getUserFinanceState($pdo, $userId);
        echo json_encode([
            'isLocalOnly' => false,
            'userId' => (int)$userId,
            'email' => $email,
            'state' => $userState,
            'message' => $isNew ? "تم إنشاء حسابك الجديد بنجاح!" : "تم تسجيل الدخول بنجاح وتحميل بياناتك السحابية!"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// ---------------------------------------------------------
// ROUTE: GOOGLE GMAIL LOGIN
// ---------------------------------------------------------
if ($route === 'auth/google') {
    $email = trim($input_data['email'] ?? '');

    if (empty($email)) {
        http_response_code(400);
        echo json_encode(["error" => "الرجاء إدخال بريد Gmail الخاص بك."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            $userId = $user['id'];
            $isNew = false;
        } else {
            // Auto Register
            $stmt = $pdo->prepare("INSERT INTO users (email, password, bank_balance, cash_balance, gold_grams, gold_price_per_gram, goal_target, goal_title) VALUES (?, 'google-oauth', 0.00, 0.00, 0.000, 75.00, 100000.00, 'توفير مئة ألف يورو')");
            $stmt->execute([$email]);
            $userId = $pdo->lastInsertId();

            $defaultBudgets = [
                'rent' => 0.00, 'groceries' => 0.00, 'utilities' => 0.00, 'transportation' => 0.00,
                'health' => 0.00, 'entertainment' => 0.00, 'gold_buy' => 0.00, 'other_expense' => 0.00
            ];
            $stmtInsert = $pdo->prepare("INSERT INTO category_budgets (user_id, category_key, limit_amount) VALUES (?, ?, 0.00)");
            foreach ($defaultBudgets as $key => $limit) {
                $stmtInsert->execute([$userId, $key]);
            }
            $isNew = true;
        }

        $userState = getUserFinanceState($pdo, $userId);
        echo json_encode([
            'isLocalOnly' => false,
            'userId' => (int)$userId,
            'email' => $email,
            'state' => $userState,
            'message' => $isNew ? "تم إنشاء حسابك الجديد بواسطة Google بنجاح!" : "تم تسجيل الدخول بواسطة Google بنجاح وتم مزامنة بياناتك السحابية!"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// ---------------------------------------------------------
// ROUTE: STATE SYNC SAVE
// ---------------------------------------------------------
if ($route === 'sync/save') {
    $userId = (int)($input_data['userId'] ?? 0);
    $state = $input_data['state'] ?? null;

    if ($userId <= 0 || !$state) {
        http_response_code(400);
        echo json_encode(["error" => "بيانات المزامنة غير مكتملة."]);
        exit;
    }

    $success = saveUserFinanceState($pdo, $userId, $state);
    echo json_encode([
        'success' => $success,
        'message' => $success ? "تمت مزامنة وحفظ كافة البيانات على قاعدة البيانات بنجاح! ☁️" : "فشل مزامنة وحفظ البيانات على خادم MySQL."
    ]);
    exit;
}

// ---------------------------------------------------------
// ADMIN PANEL ENDPOINTS
// ---------------------------------------------------------
if ($route === 'admin/users') {
    $adminEmail = $_GET['adminEmail'] ?? '';
    if ($adminEmail !== 'admin@hassala.com') {
        http_response_code(403);
        echo json_encode(["error" => "غير مصرح لك بالولوج للوحة تحكم المدير."]);
        exit;
    }

    try {
        $stmt = $pdo->query("SELECT id, email, bank_balance as bankBalance, cash_balance as cashBalance, gold_grams as goldGrams, gold_price_per_gram as goldPricePerGram, goal_target as goalTarget, goal_title as goalTitle, created_at as createdAt FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        
        // Clean types
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            $user['bankBalance'] = (float)$user['bankBalance'];
            $user['cashBalance'] = (float)$user['cashBalance'];
            $user['goldGrams'] = (float)$user['goldGrams'];
            $user['goldPricePerGram'] = (float)$user['goldPricePerGram'];
            $user['goalTarget'] = (float)$user['goalTarget'];
        }

        echo json_encode(["users" => $users]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// Match user state requests
if (preg_match('#^admin/user/(\d+)/state$#', $route, $matches)) {
    $adminEmail = $_GET['adminEmail'] ?? '';
    if ($adminEmail !== 'admin@hassala.com') {
        http_response_code(403);
        echo json_encode(["error" => "غير مصرح لك بالولوج لهذه البيانات."]);
        exit;
    }

    $userId = (int)$matches[1];
    $state = getUserFinanceState($pdo, $userId);
    echo json_encode(["state" => $state]);
    exit;
}

// Match user update state requests
if (preg_match('#^admin/user/(\d+)/update-state$#', $route, $matches)) {
    $adminEmail = $input_data['adminEmail'] ?? '';
    if ($adminEmail !== 'admin@hassala.com') {
        http_response_code(403);
        echo json_encode(["error" => "غير مصرح لك بالولوج للوحة المدير."]);
        exit;
    }

    $userId = (int)$matches[1];
    $state = $input_data['state'] ?? null;

    if (!$state) {
        http_response_code(400);
        echo json_encode(["error" => "الرجاء إدخال بيانات الحالة المالية المراد تعديلها."]);
        exit;
    }

    $success = saveUserFinanceState($pdo, $userId, $state);
    echo json_encode([
        'success' => $success,
        'message' => "تم حفظ وتعديل بيانات العضو بنجاح بواسطة المدير! ☁️"
    ]);
    exit;
}

// Match user deletion
if (preg_match('#^admin/user/(\d+)$#', $route, $matches)) {
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        http_response_code(405);
        echo json_encode(["error" => "طريقة الطلب غير مسموح بها."]);
        exit;
    }

    $adminEmail = $_GET['adminEmail'] ?? '';
    if ($adminEmail !== 'admin@hassala.com') {
        http_response_code(403);
        echo json_encode(["error" => "غير مصرح لك بحذف المستخدمين."]);
        exit;
    }

    $userId = (int)$matches[1];
    if ($userId === 1) {
        http_response_code(400);
        echo json_encode(["error" => "غير مسموح بحذف حساب المدير الافتراضي."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        echo json_encode([
            'success' => true,
            'message' => "تم حذف حساب العضو وجميع سجلاته المالية بالكامل بنجاح!"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// ---------------------------------------------------------
// ROUTE: AI ANALYZE (Using Gemini REST API)
// ---------------------------------------------------------
if ($route === 'ai/analyze' || $route === 'ai/chat') {
    // Get Gemini Key
    $apiKey = '';
    if (defined('GEMINI_API_KEY') && !empty(GEMINI_API_KEY)) {
        $apiKey = GEMINI_API_KEY;
    } else {
        // Fallback to Server Env
        $apiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');
    }

    if (empty($apiKey)) {
        http_response_code(500);
        echo json_encode(["error" => "مفتاح Gemini API غير مكوّن. يرجى إضافته في ملف db_config.php لتشغيل المساعد الذكي."]);
        exit;
    }

    // Build Prompt Content
    if ($route === 'ai/analyze') {
        $transactions = $input_data['transactions'] ?? [];
        $gold = $input_data['gold'] ?? ['grams' => 0, 'currentPricePerGram' => 75];
        $bankBalance = (float)($input_data['bankBalance'] ?? 0);
        $goal = $input_data['goal'] ?? ['target' => 100000, 'title' => 'الهدف المالي الشخصي'];

        $currentWorth = $bankBalance + ($gold['grams'] * $gold['currentPricePerGram']);
        $progressPercent = $goal['target'] > 0 ? round(($currentWorth / $goal['target']) * 100, 1) : 0;

        $prompt = "أنت مستشار مالي ذكي وخبير في الاستثمار والادخار وإدارة ميزانيات الأفراد والذهب عيار 24.\n"
                . "الرجاء تحليل البيانات المالية التالية للمستخدم باللغة العربية بأسلوب احترافي ومحفّز وسهل الفهم:\n\n"
                . "1. الرصيد البنكي الحالي: €" . $bankBalance . "\n"
                . "2. مخزون الذهب الحالي: " . $gold['grams'] . " جرام (بسعر €" . $gold['currentPricePerGram'] . " لكل جرام، القيمة الإجمالية للذهب: €" . ($gold['grams'] * $gold['currentPricePerGram']) . ")\n"
                . "3. صافي الثروة الحالي: €" . $currentWorth . "\n"
                . "4. هدف الادخار: €" . $goal['target'] . " (\"" . $goal['title'] . "\") - نسبة الإنجاز: " . $progressPercent . "%\n"
                . "5. آخر المعاملات المالية:\n"
                . json_encode(array_slice($transactions, 0, 10), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n\n"
                . "المطلوب:\n"
                . "1. تحليل شامل للوضع المالي الحالي ونسبة الإنجاز نحو الهدف.\n"
                . "2. تقييم لنمط المصاريف والادخار بناءً على المعاملات الأخيرة.\n"
                . "3. توصيات مخصصة حول توزيع الميزانية بين (السيولة النقدية، شراء الذهب، المصاريف اليومية).\n"
                . "4. استراتيجية مقترحة للوصول لهدف €100,000 بأسرع وقت وأقل مخاطرة.\n"
                . "5. نصيحة ذهبية اليوم تتعلق بالاستثمار بالذهب عيار 24 والتحوط ضد التضخم.\n\n"
                . "تأكد من صياغة الإجابة في نظام ماركداون (Markdown) جميل ومنظم مع استخدام أيقونات وجداول ورؤوس واضحة ومبهجة لتسهيل القراءة.";

        $contents = [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ];
    } else {
        // AI Chat
        $message = $input_data['message'] ?? '';
        $history = $input_data['history'] ?? [];
        $financialData = $input_data['financialData'] ?? [];

        $bankBalance = $financialData['bankBalance'] ?? 0;
        $gold = $financialData['gold'] ?? ['grams' => 0, 'currentPricePerGram' => 75];
        $goal = $financialData['goal'] ?? ['target' => 100000, 'title' => ''];
        $currentWorth = $bankBalance + ($gold['grams'] * $gold['currentPricePerGram']);

        $systemInstruction = "أنت \"حصّالة الذكية\" - مستشار مالي مخصص ومساعد ذكي مدمج في تطبيق \"حصّالة الذهب والادخار\".\n"
                            . "وظيفتك الأساسية هي إجابة أسئلة المستخدم حول الإدارة المالية، الادخار، موازنة المصاريف، والاستثمار في الذهب عيار 24.\n\n"
                            . "الوضع المالي الحالي للمستخدم هو:\n"
                            . "- رصيد بنكي (سيولة): €" . $bankBalance . "\n"
                            . "- رصيد الذهب: " . $gold['grams'] . " جرام (سعر اليوم: €" . $gold['currentPricePerGram'] . "/جرام، القيمة: €" . ($gold['grams'] * $gold['currentPricePerGram']) . ")\n"
                            . "- صافي الثروة: €" . $currentWorth . "\n"
                            . "- الهدف: €" . $goal['target'] . " (" . $goal['title'] . ")\n\n"
                            . "إرشاداتك:\n"
                            . "1. أجب دائماً باللغة العربية بأسلوب ودود، مشجع، واحترافي.\n"
                            . "2. لا تعط نصائح استثمارية قانونية صارمة، بل نصائح توجيهية وتعليمية متميزة.\n"
                            . "3. ركز على التوازن بين المصاريف والادخار.\n"
                            . "4. استخدم ماركداون (Markdown) لتنسيق إجاباتك بشكل جميل ومريح للعين (استخدم نقاط وعناوين عريضة).\n"
                            . "5. كن مختصراً ومباشراً وتجنب الحشو الطويل غير المفيد.";

        $contents = [
            [
                "role" => "user",
                "parts" => [["text" => "System Instructions:\n" . $systemInstruction]]
            ],
            [
                "role" => "model",
                "parts" => [["text" => "مرحباً بك! أنا مستشارك المالي الذكي في حصّالة الذهب والادخار. كيف يمكنني مساعدتك اليوم في تنمية ثروتك وإدارة ميزانيتك؟"]]
            ]
        ];

        // Format history
        if (is_array($history) && count($history) > 0) {
            foreach ($history as $turn) {
                $contents[] = [
                    "role" => $turn['role'] === 'user' ? 'user' : 'model',
                    "parts" => [["text" => $turn['text']]]
                ];
            }
        }

        // Add final user message
        $contents[] = [
            "role" => "user",
            "parts" => [["text" => $message]]
        ];
    }

    // Call Gemini API using cURL
    // Use gemini-1.5-flash as the highly compatible, fast, and robust model
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
    
    $payload = [
        "contents" => $contents
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    // Set 20 second timeout for responsiveness
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    $response = curl_exec($ch);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        http_response_code(500);
        echo json_encode(["error" => "فشل الاتصال بخدمة الذكاء الاصطناعي: " . $curl_error]);
        exit;
    }

    $resData = json_decode($response, true);
    
    if ($http_code !== 200 || isset($resData['error'])) {
        $errorMsg = isset($resData['error']['message']) ? $resData['error']['message'] : "خطأ غير معروف في خادم الذكاء الاصطناعي.";
        http_response_code($http_code ?: 500);
        echo json_encode(["error" => "فشل توليد التحليل من الذكاء الاصطناعي: " . $errorMsg]);
        exit;
    }

    // Extract generated text from response
    $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
    
    if ($route === 'ai/analyze') {
        echo json_encode(["analysis" => $text]);
    } else {
        echo json_encode(["reply" => $text]);
    }
    exit;
}

// If no matching route found
http_response_code(404);
echo json_encode(["error" => "Route not found: " . $route]);
exit;
