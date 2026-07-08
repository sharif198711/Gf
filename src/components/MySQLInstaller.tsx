import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Server, 
  User, 
  Key, 
  Sparkles, 
  HelpCircle, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { getApiUrl } from '../apiClient';

interface MySQLInstallerProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallSuccess: () => void;
}

export default function MySQLInstaller({ isOpen, onClose, onInstallSuccess }: MySQLInstallerProps) {
  const [dbType, setDbType] = useState<'sqlite' | 'mysql'>('sqlite');
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbName, setDbName] = useState('secure_hassala.sqlite');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleInstallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const payload = dbType === 'sqlite' ? {
        dbType: 'sqlite',
        dbName: dbName.endsWith('.sqlite') ? dbName : `${dbName}.sqlite`,
        geminiApiKey
      } : {
        dbType: 'mysql',
        dbHost,
        dbPort,
        dbUser,
        dbPassword,
        dbName,
        geminiApiKey
      };

      const response = await fetch(getApiUrl('api/dbsetup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('Failed to parse JSON response:', jsonErr, 'Raw response:', responseText);
        
        let customError = 'تلقى التطبيق استجابة غير صالحة (ليست JSON) من السيرفر.';
        
        if (responseText.includes('<title>') && responseText.includes('</title>')) {
          const match = responseText.match(/<title>(.*?)<\/title>/i);
          if (match && match[1]) {
            customError += ` (عنوان الخطأ: ${match[1]})`;
          }
        } else if (responseText.trim().length > 0) {
          // Show up to 150 characters of the raw response
          const preview = responseText.trim().substring(0, 150);
          customError += ` (محتوى الاستجابة: "${preview}...")`;
        }
        
        customError += ' قد يكون هناك جدار حماية (ModSecurity) يمنع طلبات POST البرمجية أو إصدار PHP غير متوافق. يرجى مراجعة الاستضافة أو استخدام قاعدة بيانات MySQL عن طريق الربط اليدوي مباشرة.';
        throw new Error(customError);
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'فشل تثبيت قاعدة البيانات.');
      }

      setSuccessMsg(data.message || 'تم التثبيت بنجاح!');
      onInstallSuccess();
    } catch (err: any) {
      console.error('Installation error:', err);
      setErrorMsg(err.message || 'فشل الاتصال وتثبيت الجداول في قاعدة البيانات.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-[#131B35] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-white transition-all bg-slate-900/60 p-2 rounded-full border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">معالج التثبيت التلقائي الذكي</h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-md mx-auto">
            قم بتهيئة وتثبيت قاعدة البيانات لتطبيقك على سيرفر الاستضافة (Hostinger) بضغطة زر واحدة.
          </p>
        </div>

        {/* Selection Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setDbType('sqlite');
              setDbName('secure_hassala.sqlite');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              dbType === 'sqlite'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            التثبيت التلقائي 100% (SQLite)
          </button>
          <button
            type="button"
            onClick={() => {
              setDbType('mysql');
              setDbName('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              dbType === 'mysql'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            ربط يدوي بقاعدة (MySQL)
          </button>
        </div>

        {/* Instruction Badge */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl text-[11px] text-slate-400 font-sans leading-relaxed space-y-1.5">
          {dbType === 'sqlite' ? (
            <>
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>💡 الحل الجذري الأسهل والأسرع لـ Hostinger:</span>
              </div>
              <p className="text-slate-300 font-medium">ميزة هذا الخيار (SQLite) أنه لا يتطلب إنشاء أي قواعد بيانات أو مستخدمين في لوحة التحكم بشكل يدوي!</p>
              <p>١. سيقوم السيرفر بإنشاء ملف قاعدة البيانات <span className="font-mono text-amber-400">secure_hassala.sqlite</span> تلقائياً فوراً.</p>
              <p>٢. يتم إنشاء جميع الجداول وهيكلة البيانات والمدخرات بنسبة 100% تلقائياً دون أي تدخل منك.</p>
              <p>٣. يتم تأمين وحماية ملف البيانات بالكامل ضد أي تحميل خارجي عبر جدار الحماية <span className="font-mono font-bold text-slate-200">.htaccess</span>.</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>⚠️ يتطلب إعداداً مسبقاً في لوحة التحكم:</span>
              </div>
              <p>١. يتصل بخدمة MySQL السحابية على سيرفرك باستخدام البيانات المدخلة.</p>
              <p className="text-rose-400">٢. هام جداً: يجب أن تقوم بإنشاء قاعدة البيانات مسبقاً من لوحة تحكم الاستضافة (hPanel) وتسميتها لأن السيرفرات المشتركة تمنع السكريبتات من إنشاء قواعد بيانات جديدة لأسباب أمنية.</p>
            </>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleInstallSubmit} className="space-y-4">
          {dbType === 'mysql' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">خادم قاعدة البيانات (DB_HOST)</label>
              <div className="relative">
                <Server className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                  placeholder="127.0.0.1"
                  required
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans text-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">منفذ الخادم (DB_PORT)</label>
              <div className="relative">
                <HelpCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={dbPort}
                  onChange={(e) => setDbPort(e.target.value)}
                  placeholder="3306"
                  required
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم مستخدم قاعدة البيانات</label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="u123456789_user"
                  required
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans text-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة مرور قاعدة البيانات</label>
              <div className="relative">
                <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="كلمة مرور قوية جداً"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans text-white font-medium"
                />
              </div>
            </div>
          </div>
        </>
      )}

          {dbType === 'mysql' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم قاعدة البيانات المراد ربطها (DB_NAME)</label>
              <div className="relative">
                <Database className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="u123456789_hassala_db"
                  required={dbType === 'mysql'}
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans text-white font-medium"
                />
              </div>
            </div>
          )}

          {dbType === 'sqlite' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم ملف قاعدة البيانات (التلقائي)</label>
              <div className="relative">
                <Database className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={dbName}
                  disabled
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-xs font-sans text-slate-400 font-bold cursor-not-allowed"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              مفتاح الذكاء الاصطناعي Gemini API Key <span className="text-slate-500">(اختياري)</span>
            </label>
            <div className="relative">
              <Sparkles className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy... الخاص بك لتشغيل مستشارك المالي"
                className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono text-white font-medium"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-[11px] leading-relaxed flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="whitespace-pre-line">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-[11px] leading-relaxed flex gap-2.5 items-start">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <p className="whitespace-pre-line font-bold">{successMsg}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري فحص الاتصال وتأسيس الجداول...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>بدء التثبيت التلقائي وتأسيس قاعدة البيانات 🚀</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
