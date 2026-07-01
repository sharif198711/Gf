-- ====================================================================
-- مصفوفة الجداول لقاعدة بيانات تطبيق "حصّالة الذهب والادخار"
-- مخصصة للعمل على قواعد بيانات MySQL و MariaDB (استضافات Hostinger / cPanel)
-- ====================================================================

-- 1. جدول المستخدمين (users)
-- يحفظ بيانات الحساب، الرصيد البنكي الحالي، مخزون الذهب الحالي، وهدف الادخار الأساسي
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- لتخزين كلمة المرور المشفرة
  bank_balance DECIMAL(15, 2) DEFAULT 0.00,
  gold_grams DECIMAL(10, 3) DEFAULT 0.000,
  gold_price_per_gram DECIMAL(10, 2) DEFAULT 75.00,
  goal_target DECIMAL(15, 2) DEFAULT 100000.00,
  goal_title VARCHAR(255) DEFAULT 'توفير مئة ألف يورو',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول المعاملات المالية (transactions)
-- يحفظ جميع حركات الدخل والمصاريف ومشتريات ومبيعات الذهب لكل مستخدم
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
  amount DECIMAL(15, 2) NOT NULL,
  category VARCHAR(100) NOT NULL, -- rent, groceries, gold_buy, etc.
  description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  account VARCHAR(100) NOT NULL, -- bank, gold_purchase, etc.
  gold_grams DECIMAL(10, 3) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول ميزانيات الفئات الشهرية (category_budgets)
-- يحفظ حدود الصرف الشهرية المقررة لكل فئة مصاريف
CREATE TABLE IF NOT EXISTS category_budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_key VARCHAR(100) NOT NULL,
  limit_amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_category (user_id, category_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. إدراج مستخدم تجريبي افتراضي (تمهيد البيانات)
-- البريد الإلكتروني الافتراضي: admin@hassala.com
-- كلمة المرور الافتراضية: 123456
INSERT INTO users (email, password, bank_balance, gold_grams, gold_price_per_gram, goal_target, goal_title)
VALUES ('admin@hassala.com', '123456', 1980.00, 10.000, 75.00, 100000.00, 'توفير مئة ألف يورو')
ON DUPLICATE KEY UPDATE email=email;

-- 5. إدراج معاملات تجريبية للمستخدم الافتراضي
-- (id = 1 هو معرف المستخدم admin@hassala.com الافتراضي)
INSERT INTO transactions (id, user_id, date, type, amount, category, description, account, gold_grams)
VALUES 
  ('init-1', 1, CURDATE() - INTERVAL 10 DAY, 'income', 4200.00, 'salary', 'الراتب الشهري الأساسي', 'bank', NULL),
  ('init-2', 1, CURDATE() - INTERVAL 9 DAY, 'expense', 1100.00, 'rent', 'إيجار شقة السكن لشهر يونيو', 'bank', NULL),
  ('init-3', 1, CURDATE() - INTERVAL 7 DAY, 'expense', 150.00, 'utilities', 'فاتورة الكهرباء والغاز والانترنت والماء', 'bank', NULL),
  ('init-4', 1, CURDATE() - INTERVAL 5 DAY, 'expense', 750.00, 'gold_buy', 'ادخار وشراء سبيكة ذهب عيار 24', 'gold_purchase', 10.000),
  ('init-5', 1, CURDATE() - INTERVAL 2 DAY, 'expense', 220.00, 'groceries', 'مقاضي ومواد غذائية ولحوم للبيت', 'bank', NULL)
ON DUPLICATE KEY UPDATE id=id;

-- 6. إدراج ميزانيات الفئات للمستخدم الافتراضي
INSERT INTO category_budgets (user_id, category_key, limit_amount)
VALUES 
  (1, 'rent', 1200.00),
  (1, 'groceries', 400.00),
  (1, 'utilities', 200.00),
  (1, 'transportation', 150.00),
  (1, 'health', 100.00),
  (1, 'entertainment', 250.00),
  (1, 'gold_buy', 1000.00),
  (1, 'other_expense', 300.00)
ON DUPLICATE KEY UPDATE limit_amount=VALUES(limit_amount);
