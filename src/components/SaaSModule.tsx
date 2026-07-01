import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Printer, 
  Download, 
  Check, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Lock, 
  FileText,
  AlertCircle,
  HelpCircle,
  Activity,
  UserCheck,
  Zap,
  Briefcase
} from 'lucide-react';
import { AppData, Transaction } from '../types';

interface SaaSModuleProps {
  appData: AppData;
  onUpdateSaaSTier: (tier: 'free' | 'monthly' | 'lifetime') => void;
  onAddTransaction: (newTx: Omit<Transaction, 'id'>) => void;
}

export default function SaaSModule({ appData, onUpdateSaaSTier, onAddTransaction }: SaaSModuleProps) {
  const isPremium = appData.premiumTier && appData.premiumTier !== 'free';
  const currentTier = appData.premiumTier || 'free';

  // State
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Report Builder State
  const [reportTitle, setReportTitle] = useState('التقرير المالي الموحد ومحفظة الاستثمار بالذهب');
  const [organizationName, setOrganizationName] = useState('شركة المدخرات الشخصية المحدودة');
  const [includeLedger, setIncludeLedger] = useState(true);
  const [includeGold, setIncludeGold] = useState(true);
  const [includeAI, setIncludeAI] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [customNotes, setCustomNotes] = useState('تم إنشاء هذا التقرير وتصديره تلقائياً باستخدام النسخة الاحترافية من تطبيق حصالة للذهب والادخار.');

  // Simulated credit card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    // Format groups of 4
    const groups = value.match(/.{1,4}/g);
    setCardNumber(groups ? groups.join(' ') : value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length > 2) {
      setExpiry(value.substring(0, 2) + '/' + value.substring(2));
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) setCvv(value);
  };

  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3) {
      alert('الرجاء إدخال بيانات البطاقة بشكل صحيح للمحاكاة الآمنة.');
      return;
    }
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      onUpdateSaaSTier(selectedPlan);

      // Register payment as a mock income/expense transaction if requested or keep audit logs
      onAddTransaction({
        date: new Date().toISOString().substring(0, 10),
        type: 'expense',
        amount: selectedPlan === 'monthly' ? 1.00 : 35.00,
        category: 'other_expense',
        description: `ترقية الحساب للباقة الاحترافية - ${selectedPlan === 'monthly' ? 'اشتراك شهري' : 'شراء مدى الحياة'}`,
        account: 'bank'
      });
    }, 2000);
  };

  // Safe High-Fidelity Browser-based Print to PDF
  const triggerPrintPDF = () => {
    window.print();
  };

  // Math Metrics
  const totalGoldValue = appData.gold.grams * appData.gold.currentPricePerGram;
  const netWealth = appData.bankBalance + totalGoldValue;

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600 animate-pulse" />
            النظام الاحترافي والفوترة الموحدة
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            تحكم بمدخراتك بمزايا SaaS المتقدمة، وفعّل الاشتراك لفتح التصدير والتقارير التنفيذية.
          </p>
        </div>
        
        {/* Active Badge */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-xs w-fit">
          <div className={`w-2.5 h-2.5 rounded-full ${isPremium ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-xs font-bold text-slate-700">
            الحالة: {currentTier === 'free' ? 'الباقة الأساسية المجانية' : currentTier === 'monthly' ? 'الاشتراك الاحترافي النشط (1€/شهرياً)' : 'النسخة الاحترافية مدى الحياة (35€)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Pricing Plans or Premium Report Builder */}
        <div className="lg:col-span-8 space-y-6">
          
          {!isPremium && !isCheckingOut ? (
            /* SaaS Pricing Screen */
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#0B132B] to-[#1C2A4A] p-8 rounded-3xl text-white text-right space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>انضم لأكثر من 14,000 عميل مالي ذكي حول العالم</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black leading-snug text-white">
                  لماذا تشترك في نظام <span className="text-amber-400">حصّالة برو</span>؟
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed font-sans max-w-2xl">
                  ترقية حسابك تمنحك إمكانية تصدير التقارير المالية التنفيذية بصيغة PDF لتقديمها للمحاسبين أو مراجعتها، تحليل ميزانيتك بالكامل بلا قيود، إدارة الذهب عيار 24 مع تنبيهات الأسعار الفورية، وتوليد نصائح استراتيجية مستمرة من الذكاء الاصطناعي.
                </p>
                
                {/* Benefits grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-sans">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تصدير تقارير محاسبية ودفاتر القيود كـ PDF جاهز للطباعة</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>استفسارات غير محدودة مع المستشار المالي (Gemini Pro)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تحديد وتحليل ميزانيات الفترات (موازنة يومية، أسبوعية وسنوية)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>دعم فني متميز وحفظ سحابي مشفر أو محلي 100%</span>
                  </div>
                </div>
              </div>

              {/* Plans Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Plan 1: Monthly Subscription */}
                <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-indigo-200 transition-all space-y-6 flex flex-col justify-between shadow-xs">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg">الاشتراك الشهري الآمن</span>
                      <span className="text-slate-400 text-[10px] font-sans">تجديد شهري</span>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-3xl font-mono font-black text-slate-900">
                        €1.00 <span className="text-sm font-sans font-normal text-slate-400">/ شهرياً</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans">أقل من سعر كوب قهوة واحد لمضاعفة ثروتك وأمانك المالي</p>
                    </div>

                    <hr className="border-slate-100" />

                    <ul className="space-y-3 text-xs text-slate-600 font-sans">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>تصدير التقارير المالية ومحفظة الذهب لملفات PDF</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>التحليل الشامل التلقائي للمصروفات والادخار</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>مستشار مالي بالذكاء الاصطناعي متاح 24/7</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>إلغاء الاشتراك في أي وقت بنقرة واحدة</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => { setSelectedPlan('monthly'); setIsCheckingOut(true); }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs"
                  >
                    اشترك الآن بـ 1 يورو شهرياً
                  </button>
                </div>

                {/* Plan 2: Lifetime Purchase */}
                <div className="bg-gradient-to-b from-indigo-50/20 to-white rounded-3xl p-6 border-2 border-indigo-600/30 hover:border-indigo-600 transition-all space-y-6 flex flex-col justify-between shadow-sm relative">
                  <div className="absolute top-0 left-6 -translate-y-1/2 bg-amber-500 text-slate-950 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    الأكثر مبيعاً ⚡
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-amber-50 text-amber-800 font-bold px-3 py-1.5 rounded-lg border border-amber-200">مدى الحياة (شراء لمرة واحدة)</span>
                      <span className="text-amber-600 text-[10px] font-sans">توفير 85%</span>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-3xl font-mono font-black text-indigo-950">
                        €35.00 <span className="text-sm font-sans font-normal text-slate-400">دفعة واحدة للأبد</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans">تملك البرنامج بالكامل مدى الحياة بلا اشتراكات متكررة</p>
                    </div>

                    <hr className="border-slate-100" />

                    <ul className="space-y-3 text-xs text-slate-600 font-sans">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-900">كل مميزات الاشتراك الشهري للأبد</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>أولوية الاتصال بخوادم ذكاء جوجل (أسرع بـ 3 أضعاف)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تصدير السجل المحاسبي التاريخي كاملاً بلا حدود</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تحديثات النظام المستقبلية مجاناً مدى الحياة</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => { setSelectedPlan('lifetime'); setIsCheckingOut(true); }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/15"
                  >
                    امتلك النسخة الكاملة بـ 35 يورو فقط
                  </button>
                </div>

              </div>
            </div>
          ) : !isPremium && isCheckingOut ? (
            /* Checkout Credit Card Simulator */
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">بوابة الدفع الآمنة والترقية المحاكية</h3>
                    <p className="text-[10px] text-slate-400 font-sans">بياناتك محمية ومجهزة بالكامل للترقية الفورية</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCheckingOut(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  إلغاء والعودة
                </button>
              </div>

              {/* Checkout details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Mock Credit Card Visualization */}
                <div className="bg-gradient-to-br from-indigo-600 to-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between h-44 shadow-lg shadow-indigo-600/10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-200">الباقة المختارة</span>
                      <p className="text-xs font-bold text-amber-400">
                        {selectedPlan === 'monthly' ? 'الاشتراك الشهري الاحترافي' : 'النسخة الكاملة مدى الحياة'}
                      </p>
                    </div>
                    <Coins className="w-6 h-6 text-amber-400" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-base font-mono tracking-widest">{cardNumber || '•••• •••• •••• ••••'}</div>
                    <div className="flex justify-between text-[10px] font-sans text-slate-300">
                      <div>
                        <span className="block text-[8px] text-slate-400">صاحب البطاقة</span>
                        <span>{cardName.toUpperCase() || 'اسم العميل'}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400">التاريخ</span>
                        <span>{expiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Card details Form */}
                <form onSubmit={handleProcessCheckout} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم حامل البطاقة</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Sharif Muhandes"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رقم البطاقة</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الانتهاء</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-center"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رمز التحقق (CVV)</label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={handleCvvChange}
                        placeholder="***"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-center"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10px] text-amber-800 leading-relaxed font-sans">
                    💡 <span className="font-bold">محاكاة الدفع الآمنة:</span> هذا النظام متوافق مع استضافة Hostinger ومحمي بالكامل. يمكنك إدخال أي أرقام عشوائية لإكمال عملية الشراء الوهمية بنجاح واختبار الخصائص دون أي رسوم حقيقية.
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    {isProcessingPayment ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري معالجة الدفع الآمن وسحب المعاملة...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>تأكيد دفع €{selectedPlan === 'monthly' ? '1.00' : '35.00'} وترقية الحساب</span>
                      </>
                    )}
                  </button>
                </form>

              </div>
            </div>
          ) : (
            /* Premium Report Builder Screen */
            <div className="space-y-6">
              
              {/* Report Configuration Panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">منشئ ومصدّر التقارير المالية التنفيذية (PDF)</h3>
                    <p className="text-xs text-slate-400 font-sans">حدد المعايير والعناوين لتوليد ملف PDF عالي الدقة جاهز للطباعة والاحتفاظ به</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان التقرير المالي الرئيسي</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المنظمة / المحفظة</label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Checkbox fields to toggle sections */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">الأقسام المراد تضمينها في التقرير</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/40 transition-all text-xs">
                      <input
                        type="checkbox"
                        checked={includeMetrics}
                        onChange={(e) => setIncludeMetrics(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700">مؤشرات الأصول</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/40 transition-all text-xs">
                      <input
                        type="checkbox"
                        checked={includeLedger}
                        onChange={(e) => setIncludeLedger(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700">سجل المعاملات</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/40 transition-all text-xs">
                      <input
                        type="checkbox"
                        checked={includeGold}
                        onChange={(e) => setIncludeGold(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700">تفاصيل محفظة الذهب</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/40 transition-all text-xs">
                      <input
                        type="checkbox"
                        checked={includeAI}
                        onChange={(e) => setIncludeAI(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700">تحليلات المستشار الذكي</span>
                    </label>
                  </div>
                </div>

                {/* Custom notes or footnotes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات مخصصة أو تذييل للتقرير</label>
                  <textarea
                    rows={2}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600 leading-relaxed font-sans"
                  />
                </div>

                {/* Action trigger button */}
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={triggerPrintPDF}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>توليد وتصدير ملف الـ PDF المالي</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Live Preview of the printable statement before clicking download */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-md uppercase">معاينة مباشرة للصفحة المطبوعة</span>
                
                {/* The actual component styled to layout cleanly as PDF on A4 */}
                <div id="printable-report" className="border border-slate-100 p-8 rounded-2xl bg-white text-slate-900 space-y-6 text-right font-sans max-w-4xl mx-auto">
                  
                  {/* Executive Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
                    <div className="space-y-1">
                      <h1 className="text-lg font-black text-slate-900">{reportTitle}</h1>
                      <p className="text-xs text-slate-500 font-semibold">{organizationName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">تاريخ الاستخراج: {new Date().toISOString().substring(0, 10)}</p>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-black">حصّالة برو 👑</div>
                      <span className="text-[9px] text-slate-400 font-mono block">الرقم المرجعي: HSL-{(Math.random()*1000000).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Summary Metrics */}
                  {includeMetrics && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2">أولاً: ملخص الأصول وصافي الثروة الحالية</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block font-semibold">رصيد البنك النقدى</span>
                          <span className="text-sm font-mono font-bold text-slate-800">€{appData.bankBalance.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block font-semibold">مخزون الذهب عيار 24</span>
                          <span className="text-sm font-mono font-bold text-amber-700">{appData.gold.grams.toLocaleString()} جرام</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block font-semibold">القيمة السوقية للذهب</span>
                          <span className="text-sm font-mono font-bold text-amber-800">€{totalGoldValue.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 bg-indigo-50/20 border-indigo-100">
                          <span className="text-[10px] text-indigo-800 block font-bold">إجمالي أصولك الموحدة</span>
                          <span className="text-sm font-mono font-bold text-indigo-900">€{netWealth.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gold Portfolio details */}
                  {includeGold && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2">ثانياً: تفاصيل تقييم الاستثمار في الذهب عيار 24</h3>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-sans">
                        <div>
                          <span>سعر جرام الذهب عيار 24 المعتمد بالتقرير: </span>
                          <span className="font-mono font-bold text-slate-900">€{appData.gold.currentPricePerGram}</span>
                        </div>
                        <div>
                          <span>نسبة أصول الذهب من إجمالي الثروة: </span>
                          <span className="font-mono font-bold text-amber-700">
                            {((totalGoldValue / (netWealth || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span>حالة المحفظة: </span>
                          <span className="font-bold text-emerald-600">آمنة ومحصنة ضد التضخم</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ledger Tables */}
                  {includeLedger && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2">ثالثاً: سجل القيود والمعاملات المالية الأخيرة</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs font-sans border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] border-b border-slate-200">
                              <th className="py-2.5 px-3">التاريخ</th>
                              <th className="py-2.5 px-3">البيان / الوصف</th>
                              <th className="py-2.5 px-3">الحساب</th>
                              <th className="py-2.5 px-3 text-left">المبلغ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {appData.transactions.slice(0, 10).map((t, idx) => (
                              <tr key={idx} className="text-slate-600 hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono text-[10px]">{t.date}</td>
                                <td className="py-2 px-3 font-medium">
                                  {t.description}
                                  {t.goldGrams ? ` (${t.goldGrams} جرام ذهب)` : ''}
                                </td>
                                <td className="py-2 px-3 text-[10px]">
                                  {t.account === 'bank' ? '🏦 البنك النقدى' : t.account === 'gold_purchase' ? '⚖️ شراء الذهب' : '⚖️ بيع الذهب'}
                                </td>
                                <td className={`py-2 px-3 font-mono font-bold text-left ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* AI insights recommendations */}
                  {includeAI && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-black text-slate-800 border-r-4 border-indigo-600 pr-2">رابعاً: مخرجات التحليل الاستراتيجي (حصالة AI)</h3>
                      <div className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-xl text-[11px] text-slate-700 leading-relaxed font-sans">
                        بناءً على تتبع سلوكك المالي، ننصح بمواصلة ادخار ما لا يقل عن <strong className="text-indigo-900">15% من الدخل الشهري</strong> بالذهب عيار 24 لضمان الحفاظ على القيمة الشرائية للسيولة. رصيدك الحالي من أصول الذهب يشكل سياج حماية ممتاز ضد صدمات الأسواق.
                      </div>
                    </div>
                  )}

                  {/* Notes / Footer of page */}
                  {customNotes && (
                    <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 italic font-sans">
                      {customNotes}
                    </div>
                  )}

                  {/* Signatures block */}
                  <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                    <div className="text-center w-36 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">توقيع العميل</span>
                      <div className="h-10 border-b border-dashed border-slate-300" />
                    </div>
                    <div className="text-center w-36 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">الختم المالي المعتمد</span>
                      <div className="w-16 h-16 rounded-full border border-dashed border-indigo-200 flex items-center justify-center mx-auto bg-indigo-50/10">
                        <span className="text-[9px] text-indigo-500 font-bold tracking-tight animate-spin">HASSALA PRO</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
          
        </div>

        {/* Right Column: Active Pro Subscription details & billing settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">مركز إدارة العضوية</h3>
                <p className="text-[9px] text-slate-400 font-sans">إعدادات SaaS والفواتير والترقيات الموثقة</p>
              </div>
            </div>

            {/* Current details list */}
            <div className="space-y-4 text-xs font-sans">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">نوع الباقة الحالية:</span>
                <span className="font-bold text-white">
                  {currentTier === 'free' ? 'الباقة المجانية' : currentTier === 'monthly' ? 'الاشتراك الاحترافي Pro' : 'النسخة الكاملة مدى الحياة'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">سعر الاشتراك/النسخة:</span>
                <span className="font-bold text-white">
                  {currentTier === 'free' ? '0 يورو' : currentTier === 'monthly' ? '1€ / شهرياً' : '35€ دفع لمرة واحدة'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">تاريخ التجديد/التنشيط:</span>
                <span className="font-mono text-white">
                  {currentTier === 'free' ? 'لا يوجد' : new Date().toISOString().substring(0, 10)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">تصدير تقارير PDF:</span>
                <span className={`font-bold ${isPremium ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {isPremium ? 'مفعّل بالكامل ✓' : 'تتطلب الترقية 🔒'}
                </span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-slate-400">نصائح الذكاء الاصطناعي:</span>
                <span className={`font-bold ${isPremium ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {isPremium ? 'غير محدودة وأسرع ✓' : 'محدودة بقوة'}
                </span>
              </div>
            </div>

            {/* Premium action toggles or simulation tool */}
            {isPremium ? (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    onUpdateSaaSTier('free');
                    setIsCheckingOut(false);
                    setPaymentSuccess(false);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-800"
                >
                  إلغاء تنشيط الباقة والعودة للمجانية
                </button>
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  بإلغاء تفعيل الباقة، ستعود لحسابك الأساسي، وسيتم حظر تصدير الـ PDF والمستشار المساعد مجدداً.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-[10px] text-slate-400 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <p>
                  🛡️ <strong className="text-slate-200">الأمان والتوافقية:</strong> التطبيق مصمم ليكون متوافقاً تماماً مع جميع خوادم الويب واستضافات Hostinger. يتم حفظ كافة معلومات العضوية والفواتير والقيود داخل مخزنك المحلي الآمن والمشفر دون مشاركتها خارج جهازك.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Print-specific style injected dynamically to ensure high-fidelity printing formatting */}
      <style>{`
        @media print {
          /* Hide everything in the body */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          /* Ensure our specific container is visible and fills the paper space */
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          /* Ensure high-contrast and clear font styling in print */
          h1, h2, h3, h4, th, td, p, span, strong {
            color: black !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border-bottom: 1px solid #ddd !important;
            padding: 8px !important;
          }
        }
      `}</style>

    </div>
  );
}
