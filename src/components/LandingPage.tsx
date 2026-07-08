import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CheckCircle2,
  TrendingUp,
  Database,
  Target,
  PiggyBank,
  Eye,
  Activity,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  Zap,
  Globe,
  Info
} from 'lucide-react';
import MySQLInstaller from './MySQLInstaller';
import { getApiUrl } from '../apiClient';

interface LandingPageProps {
  onLoginSuccess: (email: string, userId?: number, remoteState?: any) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showInstaller, setShowInstaller] = useState(false);
  
  // Tab within the Hero Conversion Card: 'signup' or 'preview'
  const [activeHeroTab, setActiveHeroTab] = useState<'signup' | 'preview'>('signup');
  
  // Internal auth state for the hero form / main form
  const [email, setEmail] = useState('admin@hassala.com');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  
  // Interactive Simulator State
  const [monthlyIncome, setMonthlyIncome] = useState(3500);
  const [leakPercent, setLeakPercent] = useState(15);

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.toLowerCase().endsWith('@gmail.com')) {
      setErrorMsg('الرجاء إدخال بريد Gmail صحيح ينتهي بـ @gmail.com');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setShowGoogleModal(false);

    try {
      const response = await fetch(getApiUrl('api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail.toLowerCase() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ في المصادقة بواسطة Google.');
      }

      const data = await response.json();
      if (data.isLocalOnly) {
        onLoginSuccess(googleEmail.toLowerCase());
      } else {
        onLoginSuccess(data.email, data.userId, data.state);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

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
      const endpoint = isRegister ? 'api/auth/register' : 'api/auth/login';
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ في المصادقة.');
      }

      const data = await response.json();
      
      if (data.isLocalOnly) {
        onLoginSuccess(email);
      } else {
        onLoginSuccess(data.email, data.userId, data.state);
      }
    } catch (err: any) {
      console.warn('⚠️ Server auth error:', err.message);
      setErrorMsg(err.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060B1A] text-slate-100 font-sans overflow-x-hidden selection:bg-amber-500 selection:text-slate-900 relative" dir="rtl">
      
      {/* Absolute Decorative Glow Elements */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header (Premium Glass Header) */}
      <header className="sticky top-0 z-50 bg-[#060B1A]/85 backdrop-blur-md border-b border-slate-900/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-2.5 rounded-xl shadow-md shadow-amber-500/10">
              <Coins className="w-5 h-5 text-slate-950" />
            </div>
            <div className="text-right">
              <span className="text-sm sm:text-base font-black text-white block leading-tight">
                حصّالة <span className="text-amber-400">الذهب والادخار</span>
              </span>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">منصة السيادة المالية الشخصية</span>
            </div>
          </div>

          {/* Action buttons (Desktop) */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button 
              onClick={() => setShowInstaller(true)}
              className="hidden sm:flex text-xs font-bold text-slate-300 hover:text-white transition-all px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>تنصيب قاعدة البيانات 🛠️</span>
            </button>
            
            <button 
              onClick={() => {
                setIsRegister(false);
                setShowLogin(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold text-slate-300 hover:text-white transition-all px-3 py-2 rounded-xl hover:bg-slate-900/60"
            >
              تسجيل الدخول
            </button>
            
            <button 
              onClick={() => {
                setIsRegister(true);
                setShowLogin(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-4.5 py-2 rounded-xl transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center gap-1"
            >
              <span>ابدأ مجاناً</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180 sm:rotate-0" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Landing View */}
      {!showLogin ? (
        <div className="space-y-24 pb-20">
          
          {/* Hero Section */}
          <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 lg:pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Left Column: Visual copy & Interactive Simulator */}
              <div className="lg:col-span-7 space-y-8 text-right">
                
                {/* Visual Capsule Badging */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-xs font-black shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>أين تذهب أموالك؟ تتبّع كل سنت بدقة مجهرية 🔬</span>
                </div>

                {/* Main Headline - REDESIGNED for perfect responsive scaling without clipping */}
                <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight">
                  اعرف <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">كل سنت</span> أين ذهب،<br className="hidden sm:block" />
                  وادخر بقوة لتصل لقمة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">الحرية المالية</span>
                </h1>

                {/* Sub-headline */}
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl font-sans">
                  توقف عن التساؤل "أين يتبخر راتبي؟". تطبيق <strong className="text-white">حصّالة</strong> يمنحك السيطرة المطلقة لتتبع قرش بقرش وسنت بسنت، وصنع ميزانيات مقارنة فائقة، مع تحويل ذكي للفائض إلى احتياطي ذهب عيار 24 لحماية مدخراتك من التضخم وتحقيق هدف الـ 100 ألف يورو بخطوات مكللة بالنجاح.
                </p>

                {/* Interactive Savings Leakage & Gold Advisor (The Simulator) */}
                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl space-y-5 shadow-xl backdrop-blur-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-amber-400" />
                      </div>
                      <h3 className="text-xs font-black text-white">محاكي السنت المفقود والادخار الذهبي</h3>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">حاسبة تفاعلية فورية 📊</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Input 1: Monthly Income */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>الدخل الشهري المعتاد:</span>
                        <span className="text-amber-400 font-mono font-black text-sm">€{monthlyIncome.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="15000"
                        step="250"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(parseInt(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none focus:outline-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>€1,000</span>
                        <span>€15,000</span>
                      </div>
                    </div>

                    {/* Input 2: Leakage Percentage */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>نسبة الهدر والمصاريف غير المرصودة:</span>
                        <span className="text-rose-400 font-mono font-black text-sm">{leakPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        step="1"
                        value={leakPercent}
                        onChange={(e) => setLeakPercent(parseInt(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none focus:outline-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>5% (منضبط)</span>
                        <span>40% (تسريب عالي)</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Calculations display in Bento Format */}
                  {(() => {
                    const monthlyLeak = (monthlyIncome * leakPercent) / 100;
                    const yearlyLeak = monthlyLeak * 12;
                    const goldEquivalentGrams = yearlyLeak / 75; // average price 75 per gram

                    return (
                      <div className="bg-[#070C18]/90 p-4 rounded-2xl border border-slate-850 grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
                        <div className="space-y-1 sm:border-l border-slate-800/80 sm:pl-3 last:border-0">
                          <span className="text-[10px] text-slate-400 block font-bold">تسريب شهري مخفي 💸</span>
                          <div className="text-lg font-mono font-black text-rose-400">€{monthlyLeak.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                          <span className="text-[9px] text-slate-500 font-sans block">سنتات صغيرة تتلاشى دون وعي</span>
                        </div>

                        <div className="space-y-1 sm:border-l border-slate-800/80 sm:pl-3 last:border-0">
                          <span className="text-[10px] text-slate-400 block font-bold">الهدر السنوي المتراكم ⚠️</span>
                          <div className="text-lg font-mono font-black text-amber-400">€{yearlyLeak.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                          <span className="text-[9px] text-slate-500 font-sans block">ثروة حقيقية مهدرة تماماً</span>
                        </div>

                        <div className="space-y-1 last:border-0">
                          <span className="text-[10px] text-slate-400 block font-bold">يعادل سبائك ذهبية 🪙</span>
                          <div className="text-lg font-mono font-black text-emerald-400">+{goldEquivalentGrams.toFixed(1)} جرام</div>
                          <span className="text-[9px] text-slate-500 font-sans block">سنوياً من الذهب الخالص عيار 24</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200/90 leading-relaxed font-sans text-right">
                      <strong>قوة تتبع السنت الواحد:</strong> بتفعيل الرصد المجهري في "حصالة"، ستقوم بسد هذه الثغرات فوراً وتوجيه الفائض الضائع تلقائياً لشراء جرامات الذهب وتحقيق السيادة المالية الكاملة.
                    </p>
                  </div>
                </div>

                {/* Visual conversion checklist */}
                <div className="flex flex-wrap items-center justify-start gap-4 sm:gap-6 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> لا يتطلب بطاقة ائتمان</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> حماية وتشفير محلي وسحابي كامل</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> متوافق مع كافة أنظمة الاستضافة</span>
                </div>

              </div>

              {/* Right Column: Redesigned Interactive Conversion Hub */}
              <div className="lg:col-span-5 relative w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-indigo-600/20 rounded-3xl blur-[40px] opacity-30 pointer-events-none" />
                
                <div className="relative bg-[#0E1528] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
                  
                  {/* Top Hub Header Tabs */}
                  <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-850">
                    <button
                      type="button"
                      onClick={() => setActiveHeroTab('signup')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        activeHeroTab === 'signup' 
                          ? 'bg-amber-500 text-slate-950 shadow-md' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>التسجيل السريع 🚀</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHeroTab('preview')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        activeHeroTab === 'preview' 
                          ? 'bg-amber-500 text-slate-950 shadow-md' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LineChart className="w-3.5 h-3.5" />
                      <span>واجهة النظام 📊</span>
                    </button>
                  </div>

                  {/* TAB 1 CONTENT: Direct, Quick Conversion Form */}
                  {activeHeroTab === 'signup' && (
                    <div className="space-y-5 text-right">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white">انضم للسيادة المالية مجاناً</h4>
                        <p className="text-[11px] text-slate-400 font-sans">أنشئ حسابك الفردي الآن وابدأ بتوثيق ثروتك فوراً بدون تعقيد.</p>
                      </div>

                      {/* Google Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg('');
                          setGoogleEmail('');
                          setShowGoogleModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-950 font-black py-3 px-4 rounded-xl transition-all shadow-md text-xs border border-slate-200"
                      >
                        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>تسجيل سريع بنقرة واحدة عبر Google</span>
                      </button>

                      <div className="flex items-center gap-3 text-slate-700">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[9px] uppercase font-bold shrink-0">أو بالبريد الإلكتروني</span>
                        <div className="flex-1 h-px bg-slate-800" />
                      </div>

                      {/* Regular Email form */}
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-400">البريد الإلكتروني المالي</label>
                          <div className="relative">
                            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="yourname@gmail.com"
                              required
                              className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans text-white font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-400">كلمة المرور الآمنة</label>
                          <div className="relative">
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono text-white"
                            />
                          </div>
                        </div>

                        {errorMsg && (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl text-[11px] leading-relaxed">
                            {errorMsg}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50 text-xs cursor-pointer"
                        >
                          {isLoading ? (
                            <span>جاري التحقق والولوج الآمن...</span>
                          ) : (
                            <>
                              <span>إنشاء حساب والبدء الفوري 🚀</span>
                              <ArrowRight className="w-4 h-4 rotate-180" />
                            </>
                          )}
                        </button>
                      </form>

                      {/* Quick demo account warning block */}
                      <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl text-center text-[10px] text-slate-400 leading-normal">
                        💡 تبي تجربة سريعة للنظام بدون إنشاء حساب مخصص؟<br />
                        استخدم الحساب التجريبي: <span className="font-mono text-amber-400 font-bold">admin@hassala.com</span> كلمة السر: <span className="font-mono text-amber-400 font-bold">123456</span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-3">
                        <button 
                          onClick={() => {
                            setIsRegister(false);
                            setShowLogin(true);
                          }}
                          className="hover:text-amber-400 font-bold transition-all"
                        >
                          لديك حساب بالفعل؟ سجل الدخول الآن ←
                        </button>
                        <span className="flex items-center gap-1">🔒 خوادم آمنة بالكامل</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2 CONTENT: Gorgeous App Mockup Preview */}
                  {activeHeroTab === 'preview' && (
                    <div className="space-y-5 text-right">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white">معاينة حية للمحفظة والسبائك</h4>
                        <p className="text-[11px] text-slate-400 font-sans">هكذا ستظهر شاشة تتبع ثروتك عند الدخول مباشرة.</p>
                      </div>

                      {/* Mockup Dashboard Element */}
                      <div className="bg-slate-950/85 border border-slate-850 rounded-2xl p-4.5 space-y-4">
                        
                        {/* Mockup Net worth */}
                        <div className="bg-[#0A0F1D] border border-slate-900 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                            <span>صافي الأصول والسيولة المتوفرة</span>
                            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px]">تتبع حي نشط 🟢</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-xl font-mono font-black text-white">€32,840.12</span>
                            <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                              🪙 10.0 جرام ذهب عيار 24
                            </span>
                          </div>
                        </div>

                        {/* Savings Goal progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] text-slate-400 font-sans">
                            <span>مستوى تحقيق هدف الـ 100 ألف يورو:</span>
                            <span className="text-amber-400 font-mono font-bold">32.8% مكتمل</span>
                          </div>
                          <div className="relative w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full" style={{ width: '32.8%' }} />
                          </div>
                        </div>

                        {/* Recent Transactions list */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] text-slate-500 block">آخر الحركات المالية الموثقة بالسنت:</span>
                          
                          <div className="flex items-center justify-between p-2.5 bg-[#090D1A] border border-slate-900 rounded-xl">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-sm">💼</span>
                              <div>
                                <h5 className="font-bold text-white text-[10px]">إيداع الراتب الأساسي</h5>
                                <span className="text-[8px] text-slate-500">حساب البنك</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400">+€4,200.00</span>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-[#090D1A] border border-slate-900 rounded-xl">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-sm">🪙</span>
                              <div>
                                <h5 className="font-bold text-white text-[10px]">شراء جرامات ذهب عيار 24</h5>
                                <span className="text-[8px] text-slate-500">التحوط المالي الآمن</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-400">-€750.00</span>
                          </div>
                        </div>

                        {/* AI insight mockup badge */}
                        <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex gap-2.5 text-[9px] text-amber-200">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-sans text-right">
                            <strong>الاستشاري المالي الذكي:</strong> تم سد ثغرة الهدر الترفيهي بمقدار €15 وتوفيرها لشراء الذهب. صافي ثروتك يتزايد بوتيرة مثالية!
                          </p>
                        </div>

                      </div>

                      <button
                        onClick={() => setActiveHeroTab('signup')}
                        className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-bold py-2.5 rounded-xl border border-slate-800 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>اضغط هنا لفتح حساب والبدء فوراً 🔑</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </section>

          {/* Redesigned "Before vs After" Visual Contrast Dashboard Segment */}
          <section className="relative z-10 py-16 bg-[#090E20]/75 border-t border-b border-slate-900/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 text-center">
              
              <div className="space-y-3 max-w-3xl mx-auto">
                <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full font-black">حقيقة السلوك المالي 📈</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">شاهد الفارق المالي الحقيقي بعينيك</h2>
                <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
                  الفرق بين ميزانية تنزف وسنتات مهدرة وبين بناء احتياطي صلب من السيولة النقدية وسبائك الذهب عيار 24.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                
                {/* Before Card: Financial Decay */}
                <div className="bg-[#120810]/70 border border-rose-950/40 p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden group hover:border-rose-900/55 transition-all">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex justify-between items-center border-b border-rose-950/50 pb-4">
                    <span className="text-xs text-rose-400 font-black bg-rose-500/10 px-3 py-1 rounded-lg">الوضع التقليدي (دون تتبع مجهري) ❌</span>
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">!</div>
                      <div>
                        <h4 className="text-xs font-black text-white">تسريب مستمر للسنتات والاشتراكات المنسية</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">تتلاشى نسبة 15% إلى 25% من دخلك الشهري في معاملات صغيرة غير موثقة، لتتساءل دوماً بنهاية الشهر "أين يتبخر راتبي؟".</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">!</div>
                      <div>
                        <h4 className="text-xs font-black text-white">تآكل السيولة بفعل التضخم السنوي المتسارع</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">تخزين الفائض بالكامل كنقد ورقي (كاش) يجعله يفقد قوته الشرائية تدريجياً، دون وجود أي رصيد ذهبي يحمي ممتلكاتك.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">!</div>
                      <div>
                        <h4 className="text-xs font-black text-white">قلق مالي مستمر وضبابية مستقبلية تامة</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">عدم وجود هدف واضح، وعدم تتبع الأرصدة يجعلك عرضة للوقوع في الالتزامات والأزمات المالية المفاجئة دون غطاء حقيقي.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-950/60 p-3 rounded-xl text-[10px] text-rose-300 leading-normal font-mono text-center">
                    النتيجة المتوقعة: صفر مدخرات حقيقية + خسارة مستمرة للقوة الشرائية سنوياً.
                  </div>
                </div>

                {/* After Card: Financial Prosperity */}
                <div className="bg-[#081216]/70 border border-emerald-950/40 p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden group hover:border-emerald-900/55 transition-all">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex justify-between items-center border-b border-emerald-950/50 pb-4">
                    <span className="text-xs text-emerald-400 font-black bg-emerald-500/10 px-3 py-1 rounded-lg">السيادة مع "حصّالة الذهب" 🟢</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                      <div>
                        <h4 className="text-xs font-black text-white">رصد مجهري وتوجيه حازم للفائض المالي</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">تتبع دقيق جداً لكل سنت، معرفة تامة لمواضع الصرف، ميزانيات مقارنة صارمة تمنع الإسراف وتوفر أكثر من 30% من دخلك بسهولة.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                      <div>
                        <h4 className="text-xs font-black text-white">التحوط التلقائي بسبائك الذهب عيار 24</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">تحويل ذكي وسلس للمدخرات الفائضة لسبائك ذهبية، وحفظها بدقة الغرام، لمراقبة قيمتها المتصاعدة كدرع أمان ضد تآكل العملات.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
                      <div>
                        <h4 className="text-xs font-black text-white">أهداف ذكية ومجسمة مع تنبيهات مخصصة</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">مراقبة مستمرة لمستويات تحقيق هدف الـ 100 ألف يورو مع احتفال وتنبيهات مخصصة عند قهر معالم التقدم المالي (25%، 50%، 75%).</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-950/60 p-3 rounded-xl text-[10px] text-emerald-300 leading-normal font-mono text-center">
                    النتيجة المتوقعة: نمو قياسي لصافي الثروة + محفظة سبائك صلبة تحميك وتحمي عائلتك.
                  </div>
                </div>

              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    setShowLogin(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <span>سد ثغرات ميزانيتك وافتح حصالتك الآمنة الآن 🔑</span>
                  <ArrowRight className="w-4.5 h-4.5 rotate-180" />
                </button>
              </div>

            </div>
          </section>

          {/* Redesigned 4 Steps Section */}
          <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-12">
              <div className="space-y-3 max-w-3xl mx-auto">
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold">المنهجية التشغيلية 🛡️</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">4 خطوات لتحقيق السيادة والادخار الأقصى</h2>
                <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
                  تطبيق حصّالة ليس مجرد أداة لتسجيل الأرقام، بل هو شريكك الدائم الذي يوجه سلوكك المالي ويدفعك يومياً وبكل شغف للادخار والنمو الفعلي.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
                
                <div className="bg-slate-900/65 border border-slate-800 p-6 rounded-2xl space-y-3 relative overflow-hidden group hover:border-amber-500/20 transition-all">
                  <div className="absolute top-2 left-2 text-2xl font-mono text-slate-800 font-bold group-hover:text-amber-500/10">01</div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">📥</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-all">تثبيت الأرصدة والسيولة</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    ابدأ بتسجيل رصيدك البنكي، والسيولة النقدية (الكاش) في يدك، وحصيلة جرامات الذهب الحالية لتمتلك شاشة موحدة لصافي ثروتك بدقة تامة.
                  </p>
                </div>

                <div className="bg-slate-900/65 border border-slate-800 p-6 rounded-2xl space-y-3 relative overflow-hidden group hover:border-blue-500/20 transition-all">
                  <div className="absolute top-2 left-2 text-2xl font-mono text-slate-800 font-bold group-hover:text-blue-500/10">02</div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">🔍</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-all">رصد المصاريف والمداخيل</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    سجل كل فنجان قهوة أو إيداع وسنت مفقود. أنشئ وسمِّ مسميات مخصصة لمصادر دخلك ومصروفاتك بمنتهى السلاسة والحرية.
                  </p>
                </div>

                <div className="bg-slate-900/65 border border-slate-800 p-6 rounded-2xl space-y-3 relative overflow-hidden group hover:border-teal-500/20 transition-all">
                  <div className="absolute top-2 left-2 text-2xl font-mono text-slate-800 font-bold group-hover:text-teal-500/10">03</div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg">🔄</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-teal-400 transition-all">التحويل المالي المرن</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    استخدم ميزة التحويل المالي الفوري لتحريك الأموال بين كاش اليد وحساب البنك بضغطة زر مع توثيق العملية وتطابق الأرصدة فورياً.
                  </p>
                </div>

                <div className="bg-slate-900/65 border border-slate-800 p-6 rounded-2xl space-y-3 relative overflow-hidden group hover:border-yellow-500/20 transition-all">
                  <div className="absolute top-2 left-2 text-2xl font-mono text-slate-800 font-bold group-hover:text-yellow-500/10">04</div>
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center font-bold text-lg">🪙</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-all">التحوط بالذهب الخالص</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    حوّل فوائضك لسبائك ذهب حقيقية. يتابع التطبيق غراماتك وسعر الذهب المحدث يومياً ليعرض لك صافي قيمتك الاستثمارية المحمية.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Redesigned Premium Features Detail Section */}
          <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-slate-950/30 border border-slate-900 rounded-3xl p-8 space-y-12">
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">منظومة احترافية صممت خصيصاً للسيادة المالية الشخصية</h2>
                <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
                  تم بناء تطبيق حصّالة لتوفير مستويات فائقة الدقة من مراقبة السيولة وتدشين خططة ادخار متينة تحمي ثروتك وتنميها باستمرار.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
                
                {/* Feature 1 */}
                <div className="bg-[#11182D]/85 border border-slate-850 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xl hover:border-amber-500/30 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                    <Coins className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-all">الذهب عيار 24 والتحوط الذكي</h3>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    لا تكتفي بجمع السيولة النقدية التي تفقد قيمتها بسبب التضخم. قم بتحويل فائضك المالي فوراً إلى سبائك ذهبية عيار 24 قيراط، وراقب نمو قيمتها بشكل آلي ومحدث يومياً باليورو.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#11182D]/85 border border-slate-850 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xl hover:border-indigo-500/30 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-white transition-all duration-300">
                    <LineChart className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-all">تتبّع كل سنت بدقة مجهرية</h3>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    اعرف بدقة أين تذهب أموالك عبر مقارنات زمنية فريدة (أيام، أسابيع، أشهر، سنوات). لا مزيد من المصاريف المخفية أو الاشتراكات المنسية؛ نحن نتتبع كل سنت لنمنع تسرب ميزانيتك.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#11182D]/85 border border-slate-850 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xl hover:border-purple-500/30 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-purple-400 transition-all">ادخار مدعوم بالذكاء الاصطناعي</h3>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    مستشارك المالي المدمج يحلل أنماط إنفاقك بدقة، ويقدم لك توصيات مخصصة وحلولاً عملية لسد ثغرات الهدر، ويدفعك بحماس وثقة لبلوغ هدف الـ 100,000 يورو بأسرع وقت ممكن.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Social Proof & Guarantee Section */}
          <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="bg-gradient-to-r from-amber-500/5 to-indigo-500/5 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-black text-white">ضمان الأمان والخصوصية المطلقة</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
                حصّالة صممت لتكون منصة آمنة تماماً. تظل بياناتك المالية مشفرة وخاصة بك بالكامل. نحن لا نطلب الوصول لحساباتك البنكية الفعلية بل تتبعها أنت يدوياً لتملك زمام المبادرة والأمان المطلق.
              </p>
              <div className="flex justify-center gap-4 text-[10px] text-slate-500">
                <span>🛡️ تشفير محلي سحابي</span>
                <span>•</span>
                <span>📋 لا يتطلب بطاقات فعلية</span>
                <span>•</span>
                <span>⚡ وصول سريع وبسيط</span>
              </div>
            </div>
          </section>

        </div>
      ) : (
        /* Standalone Login / Register View (REDESIGNED) */
        <main className="relative z-10 max-w-md mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[#0E1528] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Title */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isRegister ? 'إنشاء حساب مالي جديد' : 'تسجيل الدخول للنظام الآمن'}
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                {isRegister 
                  ? 'سجل عضويتك الآن لتبدأ التتبع المالي بمحفظة ذهب وادخار فارغة' 
                  : 'أدخل بياناتك للولوج لـ حصّالتك الشخصية وتتبع ميزانيتك'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isRegister ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setErrorMsg(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isRegister ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                إنشاء حساب جديد
              </button>
            </div>

            {/* Quick credentials helper */}
            {!isRegister && (
              <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl text-center text-xs text-slate-400 leading-normal">
                بريدك المالي الافتراضي للتجربة:<br />
                <span className="font-mono text-amber-400 font-bold">admin@hassala.com</span> • كلمة السر: <span className="font-mono text-amber-400 font-bold">123456</span>
                <button 
                  type="button"
                  onClick={() => setShowInstaller(true)}
                  className="block mx-auto mt-2 text-[10px] text-amber-400 hover:text-amber-300 underline font-black cursor-pointer"
                >
                  🛠️ اضغط هنا لتنصيب قاعدة بياناتك تلقائياً على السيرفر
                </button>
              </div>
            )}

            {/* Google Gmail Sign In Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setGoogleEmail('');
                  setShowGoogleModal(true);
                }}
                className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-900 font-black py-3 px-4 rounded-2xl transition-all shadow-md text-xs border border-slate-200"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>دخول سريع بـ Google Gmail</span>
              </button>

              <div className="flex items-center gap-3 text-slate-700 my-2">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[9px] uppercase font-bold shrink-0">أو بالطريقة التقليدية</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </div>

            {/* Login / Register Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">البريد الإلكتروني المالي</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-sans text-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">كلمة المرور المشفرة</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <span>جاري التحقق والفتح الآمن...</span>
                ) : (
                  <>
                    <span>{isRegister ? 'تسجيل العضوية والبدء ببيانات صفر' : 'تسجيل الدخول وفتح الحساب'}</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center text-[10px] text-slate-500">
              <button 
                type="button" 
                onClick={() => setShowLogin(false)}
                className="hover:text-slate-300 cursor-pointer"
              >
                ← العودة للصفحة الرئيسية
              </button>
              <span className="flex items-center gap-1">🔒 حماية العميل مشفرة تماماً</span>
            </div>
          </motion.div>
        </main>
      )}

      {/* Footer */}
      <footer className="bg-[#03060C] border-t border-slate-900/60 py-12 text-xs text-slate-500 text-center font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1.5 md:text-right">
            <p className="font-bold text-slate-400">حصّالة الذهب والادخار الذكية</p>
            <p>© {new Date().getFullYear()} جميع الحقوق محفوظة للعميل المالي الآمن.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <span className="hover:text-slate-300 transition-colors">متوافق مع استضافة Hostinger</span>
            <span>•</span>
            <span className="hover:text-slate-300 transition-colors">حفظ سحابي أو محلي آمن</span>
            <span>•</span>
            <button 
              onClick={() => setShowInstaller(true)} 
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              تنصيب قاعدة بيانات MySQL
            </button>
          </div>
        </div>
      </footer>

      {/* Google Modal Overlay (Direct Sign-up Support) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0E1528] border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-right space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>تسجيل الدخول الفوري بـ Google</span>
              </h3>
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              سيتم ربط حسابك بمنصة حصّالة ومزامنة بياناتك المالية سحابياً بشكل تلقائي وآمن بمجرد إدخال بريدك الإلكتروني لـ Gmail.
            </p>

            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان بريد Gmail الخاص بك</label>
                <input 
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans text-white text-left"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>تأكيد تسجيل الدخول الفوري</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Database Installer Helper Modal */}
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
