import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';

console.log('⏳ جاري بناء مشروع React باستخدام Vite...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ تم بناء ملفات الإنتاج بنجاح في مجلد (dist).');
} catch (error) {
  console.error('❌ حدث خطأ أثناء بناء التطبيق:', error);
  process.exit(1);
}

const zip = new AdmZip();

// Function to recursively add files from a folder to the root of ZIP
function addDirToZip(dirPath, zipPath = '') {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return;
  }
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativeZipPath = zipPath ? `${zipPath}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirToZip(fullPath, relativeZipPath);
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

try {
  console.log('⏳ جاري تعبئة ملفات الواجهة الأمامية (dist) داخل ملف الـ ZIP...');
  addDirToZip('dist');

  console.log('⏳ جاري إضافة ملفات PHP والـ htaccess للربط وقاعدة البيانات...');
  // Add backend files to the root of the zip
  if (fs.existsSync('api.php')) {
      zip.addLocalFile('api.php');
  } else {
      console.warn('⚠️ api.php is missing!');
  }

  if (fs.existsSync('install.php')) {
      zip.addLocalFile('install.php');
  } else {
      console.warn('⚠️ install.php is missing!');
  }

  if (fs.existsSync('.htaccess')) {
      zip.addLocalFile('.htaccess');
  } else {
      console.warn('⚠️ .htaccess is missing!');
  }

  // Add Arabic Guide
  const guideContent = `===========================================================
تطبيق حصّالة الذهب والادخار الذكي - دليل التثبيت على استضافة Hostinger
===========================================================

لقد تم تجميع ملفات تطبيقك بالكامل ليعمل بشكل مستقل وتلقائي على استضافة Hostinger 
المخصصة للأعمال (Business Shared Hosting)، بالاعتماد على قاعدة بيانات MySQL المدمجة.

الخطوات البسيطة لتشغيل التطبيق في دقيقة واحدة:

1️⃣ رفع ملف الـ ZIP واستخراجه:
   - قم بالدخول إلى لوحة تحكم Hostinger (hPanel) -> مدير الملفات (File Manager).
   - اذهب إلى المجلد المسمى (public_html) الخاص بنطاقك (domain).
   - قم برفع هذا الملف (hostinger_business_hosting.zip) بالكامل داخل public_html.
   - اضغط بزر الماوس الأيمن على الملف ثم اختر "استخراج" (Extract) لفك ضغطه مباشرة في المجلد الرئيسي.

2️⃣ إنشاء قاعدة بيانات MySQL:
   - في لوحة تحكم Hostinger، اذهب إلى قسم "قواعد البيانات" (Databases) -> قواعد بيانات MySQL.
   - قم بإنشاء قاعدة بيانات جديدة فارغة، وعيّن اسم المستخدم وكلمة المرور واحفظهم لديك.

3️⃣ تهيئة الجداول تلقائياً:
   - افتح متصفحك واذهب إلى الرابط التالي:
     https://yourdomain.com/install.php
     (مع استبدال yourdomain.com برابط موقعك الفعلي).
   - املأ بيانات قاعدة البيانات التي أنشأتها في الخطوة 2، ثم اضغط على زر التثبيت.
   - سيقوم المعالج بتهيئة الجداول بنجاح تلقائياً وحفظ الإعدادات في ملف (db_config.php).

4️⃣ حذف معالج التثبيت للأمان:
   - من أجل حماية موقعك، يرجى العودة لمدير الملفات وحذف ملف (install.php) بعد إتمام الخطوة السابقة.

5️⃣ تشغيل المساعد المالي بالذكاء الاصطناعي (Gemini) (اختياري):
   - لتشغيل ميزة المساعد المالي وتحليل الذهب باستخدام الذكاء الاصطناعي، يمكنك فتح ملف (db_config.php) في مدير الملفات بالاستضافة ووضع مفتاح API الخاص بك في الخيار المخصص:
     define('GEMINI_API_KEY', 'مفتاح_الخاص_بك_هنا');

مبارك! تطبيقك الآن جاهز بالكامل ويعمل بسلاسة فائقة، مع الحفظ السحابي الآمن والسرعة العالية!
`;
  
  fs.writeFileSync('README_HOSTINGER_AR.txt', guideContent, 'utf8');
  zip.addLocalFile('README_HOSTINGER_AR.txt');

  zip.writeZip('hostinger_business_hosting.zip');
  console.log('✅ تم إنشاء ملف hostinger_business_hosting.zip بنجاح!');

  // Cleanup local text file
  fs.unlinkSync('README_HOSTINGER_AR.txt');

} catch (error) {
  console.error('❌ حدث خطأ أثناء تجميع ملف الـ ZIP:', error);
}
