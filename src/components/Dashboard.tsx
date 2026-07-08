import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Target, 
  Briefcase, 
  Calendar, 
  Clock, 
  AlertCircle,
  HelpCircle,
  PiggyBank,
  CheckCircle2,
  Trophy,
  Sparkles,
  Award,
  X,
  Bell,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Percent,
  Edit2
} from 'lucide-react';
import { Transaction, GoldState, SavingsGoal } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  gold: GoldState;
  bankBalance: number;
  cashBalance: number;
  goal: SavingsGoal;
  categoryBudgets: { [categoryKey: string]: number };
  setBankBalance: (balance: number) => void;
  setCashBalance: (balance: number) => void;
  updateGoldPrice: (price: number) => void;
  updateGoldGrams: (grams: number) => void;
  onUpdateCategoryBudget: (category: string, limit: number) => void;
  customCategories?: { id: string; name: string; color: string }[];
  onUpdateGoal?: (target: number, title: string) => void;
  onAddTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
}

const EXPENSE_CATEGORIES_AR: { [key: string]: { name: string; icon: string; color: string } } = {
  rent: { name: 'إيجار وسكن', icon: '🏠', color: 'from-blue-500 to-indigo-500' },
  groceries: { name: 'طعام ومواد غذائية', icon: '🛒', color: 'from-emerald-500 to-green-500' },
  utilities: { name: 'فواتير ومرافق', icon: '⚡', color: 'from-cyan-500 to-blue-500' },
  transportation: { name: 'مواصلات وسيارات', icon: '🚗', color: 'from-amber-500 to-orange-500' },
  health: { name: 'صحة وعلاج وتأمين', icon: '💊', color: 'from-rose-500 to-red-500' },
  entertainment: { name: 'ترفيه وسفر وهدايا', icon: '🎉', color: 'from-pink-500 to-purple-500' },
  gold_buy: { name: 'شراء ذهب عيار 24', icon: '✨', color: 'from-yellow-400 to-amber-500' },
  other_expense: { name: 'مصاريف أخرى', icon: '📦', color: 'from-slate-500 to-gray-500' }
};

export default function Dashboard({
  transactions,
  gold,
  bankBalance,
  cashBalance,
  goal,
  categoryBudgets,
  setBankBalance,
  setCashBalance,
  updateGoldPrice,
  updateGoldGrams,
  onUpdateCategoryBudget,
  customCategories = [],
  onUpdateGoal,
  onAddTransaction
}: DashboardProps) {
  // Editing modes
  const [editingField, setEditingField] = useState<'bank' | 'cash' | 'goldPrice' | 'goldGrams' | 'goal' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Notifications and alerts
  const [dismissedMilestones, setDismissedMilestones] = useState<number[]>([]);
  const [dismissedEncouragements, setDismissedEncouragements] = useState<number[]>([]);
  const [showAllEncouragements, setShowAllEncouragements] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Money Transfer states
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferType, setTransferType] = useState<'cash_to_bank' | 'bank_to_cash'>('cash_to_bank');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  // Combined expense categories map (including custom categories)
  const allExpenseCategoriesMap: { [key: string]: { name: string; icon: string; color: string } } = {
    ...EXPENSE_CATEGORIES_AR,
  };
  
  if (customCategories && customCategories.length > 0) {
    customCategories.forEach(cat => {
      allExpenseCategoriesMap[cat.id] = {
        name: cat.name,
        icon: '🏷️',
        color: 'from-indigo-400 to-purple-500'
      };
    });
  }
  
  // Calculate financial metrics
  const totalGoldValue = gold.grams * gold.currentPricePerGram;
  const totalNetWorth = bankBalance + (cashBalance !== undefined ? cashBalance : 0.00) + totalGoldValue;
  
  // Current month's income and expenses
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr));
  
  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const currentMonthSavings = monthlyIncome - monthlyExpense;
  const currentMonthSavingsRate = monthlyIncome > 0 ? (currentMonthSavings / monthlyIncome) * 100 : 0;

  // Calculate historical monthly average savings
  const monthlySavingsMap: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach(t => {
    const month = t.date.substring(0, 7);
    if (!monthlySavingsMap[month]) {
      monthlySavingsMap[month] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      monthlySavingsMap[month].income += t.amount;
    } else {
      monthlySavingsMap[month].expense += t.amount;
    }
  });

  const monthsWithData = Object.keys(monthlySavingsMap);
  const totalHistoricalSavings = monthsWithData.reduce((sum, month) => {
    const { income, expense } = monthlySavingsMap[month];
    return sum + (income - expense);
  }, 0);
  
  const averageMonthlySavings = monthsWithData.length > 0 
    ? totalHistoricalSavings / monthsWithData.length 
    : currentMonthSavings > 0 ? currentMonthSavings : 300;

  // Goal tracking
  const remainingToGoal = Math.max(0, goal.target - totalNetWorth);
  const progressPercentage = Math.min(100, (totalNetWorth / goal.target) * 100);

  // Milestones tracking
  const milestones = [
    { percentage: 25, label: 'الربع الأول: خطوة البداية 🚀', amount: goal.target * 0.25, description: 'أحسنت! لقد ادخرت ربع المبلغ المستهدف وتخطيت أول وأهم خطوة في مشوارك المالي.' },
    { percentage: 50, label: 'منتصف الطريق: الانضباط والنمو ⚖️', amount: goal.target * 0.50, description: 'رائع جداً! رصيدك الآن يغطي نصف الهدف تماماً. ثروتك في نمو مستمر وبطريقة صحية.' },
    { percentage: 75, label: 'على مشارف الانتهاء: قمة الجبل ⛰️', amount: goal.target * 0.75, description: 'مذهل! بلغت نسبة 75%. هدف الـ 100 ألف يورو أصبح قريباً جداً ومضموناً بإذن الله.' },
    { percentage: 100, label: 'الحرية المالية المطلقة والهدف الأكبر 🏆', amount: goal.target * 1.00, description: 'تهانينا الحارة! لقد أنجزت المهمة المليونية بنسبة 100% بنجاح واكتمل الطريق.' }
  ];

  const achievedMilestones = milestones.filter(m => progressPercentage >= m.percentage);
  const latestAchieved = achievedMilestones.length > 0 ? achievedMilestones[achievedMilestones.length - 1] : null;
  const showToast = latestAchieved && !dismissedMilestones.includes(latestAchieved.percentage);

  // Dynamic encouragement list based on progress towards current goal target
  const encouragementsList = [
    {
      percentage: 25,
      title: 'الربع الأول: 25%',
      isAchieved: progressPercentage >= 25,
      isClose: progressPercentage >= 20 && progressPercentage < 25,
      message: progressPercentage >= 25
        ? `تهانينا الحارة! لقد تجاوزت الـ 25% من هدفك المالي البالغ ${goal.target.toLocaleString()} يورو. ربع الطريق تم اجتيازه بكل قوة وثبات!`
        : progressPercentage >= 20
        ? `أنت قريب جداً! يفصلك القليل لملامسة ربع هدفك المالي البالغ ${goal.target.toLocaleString()} يورو (أنت الآن في نسبة ${progressPercentage.toFixed(1)}%). واصل بهمتك العالية!`
        : `هدف الـ 25% (€${(goal.target * 0.25).toLocaleString()}) هو خطوتك الأولى العظيمة. كل معاملة ادخار تقربك أكثر!`,
      statusText: progressPercentage >= 25 ? 'تم الإنجاز 🎉' : progressPercentage >= 20 ? 'قريب جداً ⚡' : 'قيد السعي 🏁',
      statusColor: progressPercentage >= 25 
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
        : progressPercentage >= 20 
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' 
        : 'bg-slate-100 text-slate-500 border-slate-200'
    },
    {
      percentage: 50,
      title: 'منتصف الطريق: 50%',
      isAchieved: progressPercentage >= 50,
      isClose: progressPercentage >= 45 && progressPercentage < 50,
      message: progressPercentage >= 50
        ? `إنجاز رائع ومتميز! رصيدك يغطي الآن نصف هدفك المالي تماماً (€${(goal.target * 0.5).toLocaleString()}). لقد اجتزت نصف الرحلة بجدارة!`
        : progressPercentage >= 45
        ? `أنت على وشك الوصول لنصف الطريق المالي الماسي (أنت في نسبة ${progressPercentage.toFixed(1)}%). بضع مدخرات إضافية وتغزو حاجز الـ 50%!`
        : `توفير نصف المبلغ المالي المستهدف (€${(goal.target * 0.5).toLocaleString()}) سيمنحك حافزاً هائلاً. واصل بناء مدخراتك الذكية!`,
      statusText: progressPercentage >= 50 ? 'تم الإنجاز 🎉' : progressPercentage >= 45 ? 'قريب جداً ⚡' : 'قيد السعي 🏁',
      statusColor: progressPercentage >= 50 
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
        : progressPercentage >= 45 
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' 
        : 'bg-slate-100 text-slate-500 border-slate-200'
    },
    {
      percentage: 75,
      title: 'على مشارف الانتهاء: 75%',
      isAchieved: progressPercentage >= 75,
      isClose: progressPercentage >= 70 && progressPercentage < 75,
      message: progressPercentage >= 75
        ? `مذهل بحق! لقد قهرت 75% من هدفك المالي البالغ ${goal.target.toLocaleString()} يورو. الحرية المالية والاستقلال التام أصبحت على بعد أمتار قليلة!`
        : progressPercentage >= 70
        ? `نجاح باهر قريب! أنت في نسبة ${progressPercentage.toFixed(1)}% وعلى وشك تخطي حاجز الـ 75%. واصل الصعود نحو القمة مكللاً بالنجاح!`
        : `بلوغ نسبة الـ 75% (€${(goal.target * 0.75).toLocaleString()}) يضعك في مصاف المخططين الماليين العباقرة. استمر بالتقدم المبدع!`,
      statusText: progressPercentage >= 75 ? 'تم الإنجاز 🎉' : progressPercentage >= 70 ? 'قريب جداً ⚡' : 'قيد السعي 🏁',
      statusColor: progressPercentage >= 75 
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
        : progressPercentage >= 70 
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' 
        : 'bg-slate-100 text-slate-500 border-slate-200'
    }
  ];

  const activeEncouragementAlerts = encouragementsList.filter(
    e => (e.isClose || e.isAchieved) && !dismissedEncouragements.includes(e.percentage)
  );

  const currentMonthExpensesByCategory: { [key: string]: number } = {};
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      currentMonthExpensesByCategory[t.category] = (currentMonthExpensesByCategory[t.category] || 0) + t.amount;
    });

  const activeBudgetAlerts = Object.keys(EXPENSE_CATEGORIES_AR)
    .map(key => {
      const spent = currentMonthExpensesByCategory[key] || 0;
      const budget = categoryBudgets[key] || 0;
      const isExceeded = budget > 0 && spent > budget;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;
      return {
        key,
        name: EXPENSE_CATEGORIES_AR[key].name,
        icon: EXPENSE_CATEGORIES_AR[key].icon,
        spent,
        budget,
        pct,
        isExceeded,
        overage: spent - budget
      };
    })
    .filter(alert => alert.isExceeded && !dismissedAlerts.includes(alert.key));

  const handleSaveCategoryBudget = (categoryKey: string) => {
    const parsed = parseFloat(editingValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateCategoryBudget(categoryKey, parsed);
      setEditingCategory(null);
    }
  };

  const startEditingCategory = (categoryKey: string, currentLimit: number) => {
    setEditingCategory(categoryKey);
    setEditingValue(currentLimit.toString());
  };

  const monthlySavingsForCalculation = averageMonthlySavings > 50 ? averageMonthlySavings : 150;
  const monthsToGoal = remainingToGoal / monthlySavingsForCalculation;
  const yearsToGoal = Math.floor(monthsToGoal / 12);
  const remainingMonthsToGoal = Math.ceil(monthsToGoal % 12);

  const handleSaveField = () => {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed < 0) return;

    if (editingField === 'bank') {
      setBankBalance(parsed);
    } else if (editingField === 'cash') {
      setCashBalance(parsed);
    } else if (editingField === 'goldPrice' && parsed > 0) {
      updateGoldPrice(parsed);
    } else if (editingField === 'goldGrams') {
      updateGoldGrams(parsed);
    } else if (editingField === 'goal' && parsed > 0 && onUpdateGoal) {
      onUpdateGoal(parsed, editTitle);
    }

    setEditingField(null);
  };

  const openEditField = (field: 'bank' | 'cash' | 'goldPrice' | 'goldGrams' | 'goal', initialVal: number, title?: string) => {
    setEditingField(field);
    setEditValue(initialVal.toString());
    setEditTitle(title || '');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('الرجاء إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    if (transferType === 'cash_to_bank' && amount > cashBalance) {
      setTransferError('عذراً، رصيد الكاش المتوفر لديك غير كافٍ لإتمام هذا التحويل.');
      return;
    }

    if (transferType === 'bank_to_cash' && amount > bankBalance) {
      setTransferError('عذراً، رصيد الحساب البنكي المتوفر لديك غير كافٍ لإتمام هذا التحويل.');
      return;
    }

    if (onAddTransaction) {
      onAddTransaction({
        date: new Date().toISOString().substring(0, 10),
        type: transferType === 'cash_to_bank' ? 'expense' : 'income',
        amount: amount,
        category: transferType === 'cash_to_bank' ? 'transfer_to_bank' : 'transfer_to_cash',
        description: transferDescription.trim() || (transferType === 'cash_to_bank' ? 'تحويل من الكاش إلى حساب البنك' : 'تحويل من حساب البنك إلى الكاش'),
        paymentMethod: transferType === 'cash_to_bank' ? 'cash' : 'transfer',
        account: transferType === 'cash_to_bank' ? 'bank' : 'cash'
      });

      setTransferSuccess('تم التحويل بنجاح وتحديث الأرصدة تلقائياً!');
      setTransferAmount('');
      setTransferDescription('');
      setTimeout(() => {
        setTransferSuccess('');
        setShowTransferForm(false);
      }, 2000);
    } else {
      setTransferError('حدث خطأ في النظام، يرجى المحاولة لاحقاً.');
    }
  };

  return (
    <div className="space-y-6 text-slate-800" dir="rtl">
      {/* Top Welcome Header with Glass capsule */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-100/80 shadow-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-black px-2.5 py-1 bg-indigo-50 rounded-full">اللوحة الذكية</span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">نظرة عامة على ميزانيتك</h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">تتبع صافي ثروتك، مقتنياتك من الذهب، الميزانيات، ونسب الادخار بدقة وبساطة.</p>
        </div>
        
        {/* Sleek Gold badge card */}
        <div className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-200/50 rounded-2xl p-3.5 flex items-center gap-3 transition-colors cursor-pointer"
             onClick={() => openEditField('goldPrice', gold.currentPricePerGram)}>
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
            <Coins className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-amber-800/80 font-black">سعر جرام الذهب عيار 24 اليوم</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-black text-amber-950 text-base">€{gold.currentPricePerGram.toLocaleString()}</span>
              <span className="text-[10px] text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded font-bold">تعديل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Edit modal for inline updates */}
      <AnimatePresence>
        {editingField && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 max-w-sm w-full text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm">
                  {editingField === 'bank' && 'تعديل الرصيد البنكي'}
                  {editingField === 'cash' && 'تعديل رصيد الكاش'}
                  {editingField === 'goldPrice' && 'تعديل سعر الذهب (يورو / جرام)'}
                  {editingField === 'goldGrams' && 'تعديل جرامات الذهب الحالية'}
                  {editingField === 'goal' && 'تعديل الهدف المالي المستهدف'}
                </span>
                <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editingField === 'goal' && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">اسم الهدف</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="توفير ميزانية معينة"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-500">القيمة الجديدة</label>
                <input
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-left"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveField}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  تأكيد وحفظ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Milestones achieved celebration toast */}
      {showToast && latestAchieved && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-indigo-500/20 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl animate-bounce shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full inline-block">معلم مالي جديد تم تحقيقه! 🎉</span>
              <h4 className="text-base font-black text-white mt-1">{latestAchieved.label}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-xl">{latestAchieved.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10 shrink-0 w-full md:w-auto">
            <button
              onClick={() => alert('🎉 طقوس النجاح المالي: تم توثيق إنجازك بنجاح! استمر في الالتزام والنمو لتبلغ القمة.')}
              className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              احتفل بالإنجاز 🥳
            </button>
            <button
              onClick={() => setDismissedMilestones([...dismissedMilestones, latestAchieved.percentage])}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Category Budget Alerts */}
      {activeBudgetAlerts.length > 0 && (
        <div className="space-y-2">
          {activeBudgetAlerts.map(alert => (
            <motion.div
              key={alert.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl bg-white p-2 rounded-xl shadow-2xs border border-rose-100">{alert.icon}</span>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">ميزانية منتهية ⚠️</span>
                    <span className="text-[10px] text-rose-500 font-sans">هذا الشهر</span>
                  </div>
                  <p className="text-xs font-bold text-rose-950 mt-1">
                    لقد تجاوزت ميزانية <span className="underline">{alert.name}</span> بمقدار <span className="font-mono">€{alert.overage.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEditingCategory(alert.key, alert.budget)}
                  className="bg-white border border-rose-200 hover:bg-rose-100 text-rose-900 font-bold text-[11px] px-3 py-1.5 rounded-xl transition-colors"
                >
                  تعديل الميزانية
                </button>
                <button
                  onClick={() => setDismissedAlerts([...dismissedAlerts, alert.key])}
                  className="p-1 hover:bg-rose-100 rounded-lg text-rose-400 hover:text-rose-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Simplified, Gorgeous Bento Grid for Main Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Total Net Worth Card (Primary Glassmorphism Accent) */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-md flex flex-col justify-between h-48 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase text-indigo-300 font-black tracking-widest bg-indigo-900/40 px-2.5 py-1 rounded-full border border-indigo-500/10">صافي الأصول والممتلكات</span>
              <h3 className="text-2xl font-mono font-bold mt-3 text-white break-all">
                €{totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <PiggyBank className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-indigo-200/80 font-mono">
            <span>البنك: €{bankBalance.toLocaleString()}</span>
            <span>الكاش: €{cashBalance.toLocaleString()}</span>
            <span>الذهب: €{totalGoldValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Bank Balance Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between h-48 hover:border-indigo-100 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-black">الحساب البنكي</span>
              <h3 className="text-2xl font-mono font-bold text-slate-900 mt-2 break-all">
                €{bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">الأموال المودعة بالبنك</span>
            <button 
              onClick={() => openEditField('bank', bankBalance)}
              className="text-[10px] font-bold text-indigo-600 hover:underline bg-indigo-50 px-2 py-1 rounded-lg"
            >
              تعديل الرصيد
            </button>
          </div>
        </div>

        {/* Cash Balance Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between h-48 hover:border-emerald-100 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-black">خزنة الكاش السائل</span>
              <h3 className="text-2xl font-mono font-bold text-slate-900 mt-2 break-all">
                €{cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">السيولة النقدية الورقية</span>
            <button 
              onClick={() => openEditField('cash', cashBalance)}
              className="text-[10px] font-bold text-emerald-600 hover:underline bg-emerald-50 px-2 py-1 rounded-lg"
            >
              تعديل الرصيد
            </button>
          </div>
        </div>

        {/* Gold Grams holdings card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between h-48 hover:border-amber-100 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-black">مخزون الذهب عيار 24</span>
              <h3 className="text-2xl font-mono font-bold text-amber-600 mt-2 break-all">
                {gold.grams.toLocaleString()} <span className="text-xs font-sans text-slate-400">جرام</span>
              </h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-medium font-mono text-slate-400">القيمة: €{totalGoldValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <button 
              onClick={() => openEditField('goldGrams', gold.grams)}
              className="text-[10px] font-bold text-amber-700 hover:underline bg-amber-50 px-2 py-1 rounded-lg"
            >
              تعديل الجرامات
            </button>
          </div>
        </div>
      </div>



      {/* Internal Transfer Module - Extremely Simple & Sleek Block */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-black text-slate-800">إجراء مناقلة سريعة ومقاصة فورية</h4>
              <p className="text-[11px] text-slate-500 font-sans">حول المبالغ النقدية مباشرة بين البنك والخزنة الشخصية يدوياً</p>
            </div>
          </div>
          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="text-xs bg-white hover:bg-slate-100 text-indigo-600 font-bold px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            {showTransferForm ? 'إلغاء وإغلاق النموذج' : 'تحويل أموال الآن 💸'}
          </button>
        </div>

        <AnimatePresence>
          {showTransferForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleExecuteTransfer}
              className="overflow-hidden mt-4 pt-4 border-t border-slate-200/60 space-y-4 text-right"
            >
              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}
              {transferSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 block">اتجاة التحويل</label>
                  <select
                    value={transferType}
                    onChange={(e) => setTransferType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="cash_to_bank">📥 من الكاش المتوفر إلى حساب البنك</option>
                    <option value="bank_to_cash">📤 من حساب البنك إلى الكاش المتوفر</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 block">المبلغ المراد تحويله (EUR)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 text-left focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 block">البيان / ملاحظات اختيارية</label>
                  <input
                    type="text"
                    placeholder="مثال: إيداع نقدي، سحب ATM"
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  تأكيد التحويل فوراً 🚀
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Goal Savings and Milestones - Combined Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Indicator block */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="text-sm font-black text-slate-900">{goal.title || 'هدف الادخار المالي'}</h3>
                <p className="text-[11px] text-slate-400">تتبع تقدمك ومسار تقدم ثروتك نحو هدف الـ €{goal.target.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={() => openEditField('goal', goal.target, goal.title)}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg font-bold w-fit"
            >
              تعديل قيمة الهدف ✏️
            </button>
          </div>

          {/* Elegant Progress bar design */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span className="font-mono text-[11px]">المتبقي: €{remainingToGoal.toLocaleString()}</span>
              <span className="text-indigo-600 font-mono text-[13px]">{progressPercentage.toFixed(1)}% مكتمل</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                className="bg-gradient-to-l from-indigo-600 to-indigo-400 h-full rounded-full"
              />
            </div>
          </div>

          {/* Simulation stats */}
          <div className="bg-slate-50/50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-100">
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                متوسط الادخار الشهري الفعلي
              </span>
              <div className="text-sm font-mono font-black text-slate-800">
                €{monthlySavingsForCalculation.toLocaleString(undefined, { maximumFractionDigits: 0 })}/شهر
              </div>
            </div>
            <div className="space-y-0.5 text-right border-r border-slate-200/60 pr-4">
              <span className="text-[10px] text-indigo-500 font-sans flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                الوقت المتوقع لبلوغ الهدف
              </span>
              <div className="text-sm font-bold text-indigo-700">
                {yearsToGoal > 0 ? `${yearsToGoal} سنة و ${remainingMonthsToGoal} شهر` : `${remainingMonthsToGoal} أشهر`}
              </div>
            </div>
          </div>

          {/* Milestones Horizontal map */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <span className="text-[10px] text-slate-400 block font-black">معالم طريق بناء الثروة (€):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {milestones.map(m => {
                const isAchieved = progressPercentage >= m.percentage;
                return (
                  <div key={m.percentage} className={`p-2.5 rounded-xl border text-right transition-all ${
                    isAchieved ? 'bg-emerald-500/5 border-emerald-100 text-emerald-950' : 'bg-slate-50/50 border-slate-100 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold">{m.percentage}%</span>
                      {isAchieved && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                    </div>
                    <span className={`block text-[11px] font-bold mt-1 truncate ${isAchieved ? 'text-emerald-950' : 'text-slate-700'}`}>
                      {m.label.split(': ')[1] || m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wealth Distribution capsule */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="text-xs font-black text-slate-900">تنوع الأصول والسيولة</h3>
                <p className="text-[10px] text-slate-400 font-sans">توزيع محفظتك الكلية اليوم</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>السيولة النقدية البنكية والكاش</span>
                  <span className="font-mono">{totalNetWorth > 0 ? (((bankBalance + cashBalance) / totalNetWorth) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalNetWorth > 0 ? ((bankBalance + cashBalance) / totalNetWorth) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>مخزون الذهب المادي الآمن</span>
                  <span className="font-mono">{totalNetWorth > 0 ? ((totalGoldValue / totalNetWorth) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalNetWorth > 0 ? (totalGoldValue / totalNetWorth) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/60 text-[10px] text-slate-500 leading-relaxed mt-4">
            <span className="font-black text-slate-700">توجيه مالي:</span> الحفاظ على تنوع الأصول يحمي أموالك من التضخم، مع الحفاظ على جزء من السيولة للمصاريف وفرص الاستثمار المباشرة.
          </div>
        </div>
      </div>

      {/* Monthly Budget Category Limits Tracker */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-right">
              <h3 className="text-sm font-black text-slate-900">الميزانيات المحددة والإنفاق الفعلي لكل فئة</h3>
              <p className="text-[11px] text-slate-400">تابع الحدود والإنفاق الفعلي شهرياً لتفادي الإسراف المالي.</p>
            </div>
          </div>
          <div className="text-xs bg-slate-50 border border-slate-200/50 px-3 py-1.5 rounded-xl font-mono font-bold text-slate-700">
            إجمالي حدود الميزانية: €{Object.values(categoryBudgets).reduce((sum, b) => sum + b, 0).toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.keys(allExpenseCategoriesMap).map((key) => {
            const catInfo = allExpenseCategoriesMap[key];
            const spent = currentMonthExpensesByCategory[key] || 0;
            const budget = categoryBudgets[key] || 0;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            const isEditing = editingCategory === key;

            let progressColor = 'bg-indigo-500';
            let bgLight = 'bg-white hover:bg-slate-50/50';
            let borderStyle = 'border-slate-100';

            if (pct >= 100) {
              progressColor = 'bg-rose-500';
              bgLight = 'bg-rose-50/5 border-rose-100/80';
            } else if (pct >= 80) {
              progressColor = 'bg-amber-500';
              bgLight = 'bg-amber-50/5 border-amber-100/80';
            }

            return (
              <div key={key} className={`p-4 rounded-2xl border transition-all ${bgLight} ${borderStyle} flex flex-col justify-between h-40`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base bg-slate-100 p-1 rounded-lg">{catInfo.icon}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      pct >= 100 ? 'bg-rose-100 text-rose-700' : pct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pct >= 100 ? 'تجاوزت الحد' : pct >= 80 ? 'أوشكت الميزانية' : 'آمن'}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-800">{catInfo.name}</h4>

                  <div className="flex justify-between items-baseline text-[11px] text-slate-500">
                    <span>المنفق: <strong className="font-mono text-slate-800">€{spent}</strong></span>
                    {isEditing ? (
                      <div className="flex items-center gap-1 font-sans">
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-16 bg-white border border-slate-200 rounded px-1 text-center font-mono text-[11px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCategoryBudget(key);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <button onClick={() => handleSaveCategoryBudget(key)} className="text-[9px] bg-indigo-600 text-white px-1 py-0.5 rounded">حفظ</button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1">
                        الحد: <strong className="font-mono text-slate-800">€{budget}</strong>
                        <button onClick={() => startEditingCategory(key, budget)} className="text-indigo-600 text-[9px] underline font-bold">تعديل</button>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>النسبة: {pct.toFixed(0)}%</span>
                    {pct > 100 && <span className="text-rose-600">تجاوز بـ €{spent - budget}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
