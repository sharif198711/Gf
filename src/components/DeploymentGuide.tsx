import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Download, 
  Upload, 
  CheckCircle, 
  HelpCircle, 
  Server, 
  FolderOpen, 
  Compass, 
  AlertCircle,
  Code
} from 'lucide-react';
import { AppData } from '../types';

interface DeploymentGuideProps {
  appData: AppData;
  onImportData: (data: AppData) => void;
}

export default function DeploymentGuide({ appData, onImportData }: DeploymentGuideProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Export Data to JSON
  const handleExportData = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `budget_tracker_backup_${new Date().toISOString().substring(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 2. Import Data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        
        // Basic schema validation
        if (
          parsedData && 
          Array.isArray(parsedData.transactions) && 
          parsedData.gold && 
          typeof parsedData.bankBalance === 'number'
        ) {
          onImportData(parsedData);
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 4000);
        } else {
          setImportStatus('error');
          setErrorMessage('الملف غير مطابق لبنية البيانات الصحيحة للتطبيق.');
        }
      } catch (err) {
        setImportStatus('error');
        setErrorMessage('تعذر قراءة الملف. يرجى التأكد من اختيار ملف احتياطي بصيغة JSON صحيح.');
      }
    };

    fileReader.readAsText(files[0]);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">الرفع على استضافة Hostinger والنسخ الاحتياطي</h2>
        <p className="text-sm text-gray-500 mt-1 font-sans">دليل خطوة بخطوة لرفع نظامك المالي على استضافة هوستنجر الخاصة بك، مع أدوات حفظ واسترجاع بياناتك في أي وقت</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section: Backup & Recovery */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">إدارة البيانات والنسخ الاحتياطي</h3>
            <p className="text-xs text-gray-400 mt-1">احفظ بياناتك محلياً أو انقلها لجهاز آخر بسهولة تامة</p>
          </div>

          <div className="space-y-4">
            {/* Export Card */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between space-y-3">
              <div className="text-xs text-emerald-900 font-sans leading-relaxed">
                <span className="font-bold block text-sm text-emerald-800 mb-1">نسخ احتياطي للبيانات</span>
                يقوم التطبيق بحفظ البيانات تلقائياً في المتصفح، ولكن نوصي بتحميل نسخة احتياطية من معاملاتك ومخزون الذهب الخاص بك في ملف خارجي للاحتفاظ بها بشكل مستقل.
              </div>
              <button
                onClick={handleExportData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                تحميل النسخة الاحتياطية (JSON)
              </button>
            </div>

            {/* Import Card */}
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between space-y-3">
              <div className="text-xs text-indigo-950 font-sans leading-relaxed">
                <span className="font-bold block text-sm text-indigo-900 mb-1">استرجاع نسخة احتياطية</span>
                اختر ملف الـ <span className="font-mono font-bold">.json</span> الذي قمت بتحميله سابقاً لاستعادة جميع معاملاتك وبياناتك على هذا الجهاز أو بعد رفع الموقع على استضافة هوستنجر.
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportData}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                رفع واسترجاع نسخة احتياطية
              </button>

              {importStatus === 'success' && (
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 p-2.5 rounded-xl text-[11px] font-sans">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>تم استرجاع البيانات بنجاح وتحديث كافة التقارير والأرصدة!</span>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="flex items-center gap-2 bg-rose-100 text-rose-800 p-2.5 rounded-xl text-[11px] font-sans">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Step-by-Step Hostinger Deployment Guide */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">خطوات الرفع على استضافة Hostinger بالتفصيل</h3>
              <p className="text-xs text-gray-400">تابع هذا الدليل البسيط لتعمل لوحتك المالية الخاصة من أي مكان في العالم</p>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">١</span>
                <div className="w-0.5 h-full bg-gray-100" />
              </div>
              <div className="space-y-1.5 pb-4">
                <span className="font-bold text-gray-800 text-sm">تجهيز ملفات النظام (بناء المشروع)</span>
                <p className="text-gray-500 text-xs font-sans leading-relaxed">
                  عند الانتهاء من تجهيز النظام بالكامل، قم بتنزيل مجلد الأكواد كملف ZIP من خلال خيارات المطور أو استخدم سطر الأوامر التالي في مجلد المشروع لبناء النسخة المستقرة الموجهة للاستضافة:
                </p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-xl text-left font-mono text-[11px] direction-ltr select-all">
                  npm run build
                </div>
                <p className="text-[11px] text-gray-400 font-sans">
                  * هذا الأمر سينشئ مجلداً جديداً باسم <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1 rounded">dist</span> يحتوي على كافة ملفات HTML و JS و CSS التي يحتاجها متصفحك للعمل.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">٢</span>
                <div className="w-0.5 h-full bg-gray-100" />
              </div>
              <div className="space-y-1.5 pb-4">
                <span className="font-bold text-gray-800 text-sm">تسجيل الدخول إلى Hostinger hPanel</span>
                <p className="text-gray-500 text-xs font-sans leading-relaxed">
                  اذهب إلى حسابك في هوستنجر وافتح لوحة التحكم (hPanel). ابحث عن <span className="font-bold text-gray-800">مدير الملفات (File Manager)</span> المخصص لنطاقك (Domain).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">٣</span>
                <div className="w-0.5 h-full bg-gray-100" />
              </div>
              <div className="space-y-1.5 pb-4">
                <span className="font-bold text-gray-800 text-sm">رفع الملفات إلى مجلد public_html</span>
                <p className="text-gray-500 text-xs font-sans leading-relaxed">
                  ادخل إلى المجلد الأساسي لاستضافتك <span className="font-mono font-bold text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">public_html</span>.
                  قم بضغط محتويات مجلد <span className="font-mono font-bold">dist</span> بالكامل بصيغة <span className="font-mono">zip</span> ثم ارفع الملف وافتحه داخل الاستضافة (Unextract) ليصبح ملف <span className="font-mono">index.html</span> بداخل مجلد public_html مباشرة.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">٤</span>
                <div className="w-0.5 h-full bg-gray-100" />
              </div>
              <div className="space-y-1.5 pb-4">
                <span className="font-bold text-gray-800 text-sm">تثبيت قاعدة البيانات (MySQL) وتكوين البيئة</span>
                <p className="text-gray-500 text-xs font-sans leading-relaxed">
                  إذا كنت تريد تفعيل خاصية حفظ الحسابات والمزامنة السحابية المتعددة المستخدمين، قم بإنشاء قاعدة بيانات MySQL جديدة في استضافة هوستنجر (من قسم Databases)، ثم أنشئ ملفاً باسم <span className="font-mono font-bold">.env</span> في المجلد الرئيسي للاستضافة وضع فيه التفاصيل التالية:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-3.5 rounded-xl text-left font-mono text-[10.5px] direction-ltr overflow-x-auto select-all leading-normal whitespace-pre">
{`DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=u123456789_user
DB_PASSWORD=your_secure_password
DB_NAME=u123456789_hassala_db
GEMINI_API_KEY=AIzaSy...your_gemini_key`}
                </pre>
                <p className="text-gray-500 text-xs font-sans leading-relaxed mt-2">
                  بعدها، يمكنك تشغيل التثبيت التلقائي للجداول من خلال مدير الملفات أو Terminal بكتابة الأمر التالي:
                </p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-xl text-left font-mono text-[11px] direction-ltr select-all">
                  node install.js
                </div>
                <p className="text-[11px] text-gray-400 font-sans">
                  * أو يمكنك بدلاً من ذلك استيراد ملف <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1 rounded">database.sql</span> المرفق مباشرة في قاعدة البيانات عبر أداة <span className="font-bold text-gray-800">phpMyAdmin</span> في هوستنجر.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">٥</span>
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-gray-800 text-sm">النظام جاهز ومؤمّن بالكامل!</span>
                <p className="text-gray-500 text-xs font-sans leading-relaxed">
                  قم بتشغيل خادم Node.js باستخدام مدير تطبيقات Node.js في هوستنجر أو عبر سطر الأوامر <span className="font-mono">npm run start</span>. اذهب إلى النطاق المخصص لك وستجد النظام المالي يعمل بكفاءة تامة وسرعة فائقة مع قاعدة بيانات سحابية متزامنة بالكامل!
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
