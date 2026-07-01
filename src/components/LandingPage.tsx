import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Coins, 
  ShieldCheck, 
  Sparkles, 
  LineChart, 
  PieChart, 
  ArrowRight, 
  Lock, 
  User, 
  Mail,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Globe,
  Database
} from 'lucide-react';
import MySQLInstaller from './MySQLInstaller';

interface LandingPageProps {
  onLoginSuccess: (email: string, userId?: number, remoteState?: any) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showInstaller, setShowInstaller] = useState(false);
  const [email, setEmail] = useState('admin@hassala.com');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!email.includes('@') || email.length < 5) {
      setErrorMsg('الرجاء إدخال بريد إلكتروني صحيح.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 خانات.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ في المصادقة.');
      }

      const data = await response.json();
      
      // If server responded successfully
      if (data.isLocalOnly) {
        // Fallback local mode
        onLoginSuccess(email);
      } else {
        // Cloud-synced database mode!
        onLoginSuccess(data.email, data.userId, data.state);
      }
    } catch (err: any) {
      console.warn('⚠️ Server auth error, falling back to local mode:', err.message);
      // Fallback: continue in client-only localstorage mode if database server is not running or throwing errors
      onLoginSuccess(email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-white font-sans overflow-x-hidden selection:bg-amber-500 selection:text-slate-900" dir="rtl">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            حصّالة <span className="text-amber-400">الذهب والادخار</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowInstaller(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-all px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>تنصيب السحابة 🛠️</span>
          </button>
          <button 
            onClick={() => setShowLogin(true)}
            className="text-xs font-bold text-slate-300 hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-slate-800/40"
          >
            تسجيل الدخول
          </button>
          <button 
            onClick={() => { setShowLogin(true); }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 flex items-center gap-1.5"
          >
            ابدأ الآن مجاناً
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Landing / Hero Grid */}
      {!showLogin ? (
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text */}
          <div className="lg:col-span-7 space-y-8 text-right">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الجيل الجديد من منصات الإدارة المالية الشخصية بالذكاء الاصطناعي</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
              ضاعف مدخراتك واستثمر في <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                الذهب عيار 24 قيراط
              </span> بأمان ذكي
            </h1>

            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl font-sans">
              نظام مالي شخصي احترافي ومتكامل، يساعدك على التحكم بميزانيتك ومراقبة مصاريفك اليومية، الأسبوعية والسنوية، مع محفظة ذكية لحساب السبائك الذهبية والنمو المالي المدعوم بالذكاء الاصطناعي.
            </p>

            {/* Feature row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">إدارة الذهب عيار 24</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">تحديث الأسعار ومطابقة المحفظة تلقائياً باليورو</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">مدعوم بالذكاء الاصطناعي</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">مستشار مالي ذكي يقدم خطط ادخار وتوفير مخصصة</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <LineChart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">موازنات متعددة الفترات</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">موازنة ذكية ما بين الأيام والأسابيع والأشهر والسنوات</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">خصوصية تامة 100%</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">بياناتك مشفرة تماماً ومحفوظة محلياً أو على خادمك الخاص</p>
                </div>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2"
              >
                <span>ابدأ رحلتك المالية الآن مجاناً</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a 
                href="#features"
                className="bg-slate-900/60 border border-slate-800 hover:bg-slate-850/60 text-slate-300 font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                اكتشف المزايا الاحترافية
              </a>
            </div>

            {/* Trust badge */}
            <div className="pt-6 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> لا يتطلب بطاقة ائتمان</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> متوافق مع Hostinger بالكامل</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> محفظة ذهب آمنة</span>
            </div>
          </div>

          {/* Hero visual representation (Mockup) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-blue-600 rounded-3xl blur-[30px] opacity-15" />
            
            <div className="relative bg-[#131B35] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              {/* Header mockup */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded font-mono">حصالة الذهب v2.4</span>
              </div>

              {/* Balance card mockup */}
              <div className="bg-gradient-to-l from-slate-900 to-[#1A2342] p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>إجمالي أصولك الحالية</span>
                  <span className="text-emerald-500 font-bold">نشط ●</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">€32,840.00</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[65%] rounded-full" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                  <span>الهدف: 100K يورو</span>
                  <span>نسبة الإنجاز: 32.8%</span>
                </div>
              </div>

              {/* Transactions list mockup */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-300">أحدث عملياتك المالية</h4>
                
                <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="w-1.5 h-10 rounded bg-emerald-500" />
                    <div>
                      <h5 className="font-bold text-white text-[11px]">الراتب الأساسي لشهر يونيو</h5>
                      <span className="text-[9px] text-slate-500">منذ يومين • حساب البنك</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">+€4,200.00</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="w-1.5 h-10 rounded bg-amber-500" />
                    <div>
                      <h5 className="font-bold text-white text-[11px]">شراء سبيكة ذهب عيار 24</h5>
                      <span className="text-[9px] text-slate-500">منذ 5 أيام • 10 جرام ذهب</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">-€750.00</span>
                </div>
              </div>

              {/* AI Insight mockup banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex gap-3 text-xs text-amber-200">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="leading-relaxed font-sans text-[11px]">
                  <span className="font-bold text-amber-400">تحليل الحصّالة الذكية:</span> استثمارك الأخير بالذهب عادل التضخم بنسبة 4.2% مقارنة بالسيولة النقدية البنكية. يُنصح بادخار 5 جرامات أخرى هذا الشهر.
                </p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Login / Register Card view */
        <main className="relative z-10 max-w-md mx-auto px-6 py-20 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[#131B35] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
          >
            {/* Title */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white">تسجيل الدخول للنظام الآمن</h2>
              <p className="text-xs text-slate-400 font-sans">أدخل بياناتك للولوج لـ حصّالتك الشخصية وتتبع ميزانيتك</p>
            </div>

            {/* Quick credentials helper */}
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-center text-xs text-slate-400 leading-normal">
              بريدك المالي الافتراضي للتجربة:<br />
              <span className="font-mono text-amber-400 font-bold">admin@hassala.com</span> • كلمة السر: <span className="font-mono text-amber-400 font-bold">123456</span>
              <button 
                type="button"
                onClick={() => setShowInstaller(true)}
                className="block mx-auto mt-2 text-[11px] text-amber-400 hover:text-amber-300 underline font-bold"
              >
                🛠️ اضغط هنا لتنصيب قاعدة بياناتك تلقائياً على السيرفر
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">البريد الإلكتروني المالي</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="w-full pr-10 pl-4 py-3 bg-slate-955 border border-slate-800 focus:border-amber-500 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-sans text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور المشفرة</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10 pl-4 py-3 bg-slate-955 border border-slate-800 focus:border-amber-500 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs leading-relaxed text-right">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {isLoading ? (
                  <span>جاري التحقق والفتح الآمن...</span>
                ) : (
                  <>
                    <span>تسجيل الدخول وفتح الحساب</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center text-[10px] text-slate-500">
              <button 
                type="button" 
                onClick={() => setShowLogin(false)}
                className="hover:text-slate-300"
              >
                ← العودة للصفحة الرئيسية
              </button>
              <span className="flex items-center gap-1">🔒 نظام حماية العميل آمن بالكامل</span>
            </div>
          </motion.div>
        </main>
      )}

      {/* Feature section content */}
      <section id="features" className="relative z-10 bg-slate-900/30 py-20 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white">الخصائص والمزايا الاستثمارية للنظام</h2>
            <p className="text-slate-400 text-sm font-sans leading-relaxed">
              تم تصميم هذه المنصة لتوفير مستويات فائقة من التحكم والسهولة والدقة من أجل تحقيق طموحاتك ومضاعفة ثروتك الشخصية من الادخار والذهب.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
            
            <div className="bg-[#131B35]/60 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">الذهب عيار 24</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                متابعة دقيقة لمخزون الذهب الخاص بك بالجرام (سواء سبائك أو ليرات)، وحساب قيمته التلقائية باليورو بناءً على سعر الجرام اليومي القابل للتحديث.
              </p>
            </div>

            <div className="bg-[#131B35]/60 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">الموازنة الشاملة المقارنة</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                إمكانية موازنة مصاريفك ومدخراتك ومقارنتها بدقة فائقة بين الأيام، الأسابيع، الأشهر، والسنوات للتعرف على أوجه الإسراف وضبط التدفقات المالية.
              </p>
            </div>

            <div className="bg-[#131B35]/60 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">الذكاء الاصطناعي المالي</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                تحليلات عميقة ونمذجة ذكية فورية لحالتك المالية، مصحوبة بنصائح يومية واستراتيجيات مخصصة يولدها الذكاء الاصطناعي لمساعدتك في تحقيق أهدافك.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#070B19] border-t border-slate-900 py-10 text-xs text-slate-500 text-center font-sans">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} حصّالة الذهب والادخار الذكية. جميع الحقوق محفوظة للعميل المالي الآمن.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-300">متوافق مع استضافة Hostinger</span>
            <span>•</span>
            <span className="hover:text-slate-300">حفظ محلي آمن ومشفر</span>
          </div>
        </div>
      </footer>

      <MySQLInstaller 
        isOpen={showInstaller} 
        onClose={() => setShowInstaller(false)} 
        onInstallSuccess={() => {
          setShowInstaller(false);
          setShowLogin(true);
        }} 
      />

    </div>
  );
}
