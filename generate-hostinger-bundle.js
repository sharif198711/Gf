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

  if (fs.existsSync('db_config.php')) {
      console.log('✅ تم العثور على ملف db_config.php مسبق الإعداد وتم تضمينه في الحزمة سحابياً!');
      zip.addLocalFile('db_config.php');
  }

  // Add Arabic Guide
  const guideContent = `===========================================================
تطبيق حصّالة الذهب والادخار الذكي - دليل التثبيت التلقائي 100% على Hostinger
===========================================================

بشرى سارة! لقد تم إعداد هذا الملف المضغوط خصيصاً لك ببيانات قاعدة بياناتك الحقيقية بشكل كامل مسبقاً!
اسم قاعدة البيانات: u948332049_SharifVxZ
اسم المستخدم: u948332049_Lulia

لن تحتاج إلى استخدام معالج التثبيت أو إدخال أي تفاصيل لقاعدة البيانات يدوياً. بمجرد فك الضغط، سيتولى التطبيق بناء الجداول وإعداد حساباتك تلقائياً وبأمان تام في الخلفية!

الخطوات البسيطة لتشغيل التطبيق في دقيقة واحدة:

1️⃣ رفع ملف الـ ZIP واستخراجه:
   - قم بالدخول إلى لوحة تحكم Hostinger (hPanel) -> مدير الملفات (File Manager).
   - اذهب إلى المجلد المسمى (public_html) الخاص بنطاقك (domain) أو أي مجلد فرعي تفضله.
   - قم برفع هذا الملف (hostinger_business_hosting.zip) بالكامل داخل المجلد.
   - اضغط بزر الماوس الأيمن على الملف ثم اختر "استخراج" (Extract) لفك ضغطه مباشرة في المجلد الرئيسي.

2️⃣ تشغيل التطبيق تلقائياً:
   - افتح متصفحك واذهب إلى رابط موقعك مباشرة (مثلاً: https://yourdomain.com).
   - بمجرد تحميل الصفحة، سيتصل التطبيق بقاعدة البيانات تلقائياً، ويبني الجداول (users, transactions, budgets) ويزرع البيانات التجريبية والحساب التجريبي فوراً وبصمت!
   - يمكنك الآن تسجيل الدخول مباشرة أو البدء بحسابك الخاص.

3️⃣ حساب المدير والمسؤول الافتراضي:
   - تم إنشاء حساب مدير افتراضي مسبق الإعداد لتجربة الخصائص السحابية فوراً:
     البريد الإلكتروني: admin@hassala.com
     كلمة المرور: 123456
   - يمكنك تغيير كلمة المرور أو استخدام بريدك الشخصي عبر نموذج التسجيل السحابي وسيحفظ فوراً في قاعدة بياناتك الخاصة.

4️⃣ تشغيل المساعد المالي بالذكاء الاصطناعي (Gemini) (اختياري):
   - لتشغيل ميزة المساعد المالي وتحليل الذهب باستخدام الذكاء الاصطناعي، يمكنك فتح ملف (db_config.php) في مدير الملفات بالاستضافة ووضع مفتاح API الخاص بك في الخيار المخصص:
     define('GEMINI_API_KEY', 'مفتاح_الخاص_بك_هنا');

مبارك! تطبيقك الآن جاهز بنسبة 100% ويعمل بسلاسة فائقة وحفظ سحابي آمن وتلقائي تماماً!
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
