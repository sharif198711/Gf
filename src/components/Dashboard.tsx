import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  X
} from 'lucide-react';
import { Transaction, GoldState, SavingsGoal } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  gold: GoldState;
  bankBalance: number;
  goal: SavingsGoal;
  categoryBudgets: { [categoryKey: string]: number };
  setBankBalance: (balance: number) => void;
  updateGoldPrice: (price: number) => void;
  updateGoldGrams: (grams: number) => void;
  onUpdateCategoryBudget: (category: string, limit: number) => void;
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
  goal,
  categoryBudgets,
  setBankBalance,
  updateGoldPrice,
  updateGoldGrams,
  onUpdateCategoryBudget
}: DashboardProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(bankBalance.toString());
  const [isEditingGoldPrice, setIsEditingGoldPrice] = useState(false);
  const [tempGoldPrice, setTempGoldPrice] = useState(gold.currentPricePerGram.toString());
  const [isEditingGoldGrams, setIsEditingGoldGrams] = useState(false);
  const [tempGoldGrams, setTempGoldGrams] = useState(gold.grams.toString());
  const [dismissedMilestones, setDismissedMilestones] = useState<number[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  
  // Calculate financial metrics
  const totalGoldValue = gold.grams * gold.currentPricePerGram;
  const totalNetWorth = bankBalance + totalGoldValue;
  
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
    : currentMonthSavings > 0 ? currentMonthSavings : 300; // fallback default to €300/month if no data

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

  // Group current month's expenses by category
  const currentMonthExpensesByCategory: { [key: string]: number } = {};
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = t.category;
      currentMonthExpensesByCategory[cat] = (currentMonthExpensesByCategory[cat] || 0) + t.amount;
    });

  // Calculate active budget alerts
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

  // Time to reach goal estimation
  // We use average monthly savings, or current month's if it's higher, or a minimum of €50 to prevent division by zero/negative
  const monthlySavingsForCalculation = averageMonthlySavings > 50 ? averageMonthlySavings : 150;
  const monthsToGoal = remainingToGoal / monthlySavingsForCalculation;
  const yearsToGoal = Math.floor(monthsToGoal / 12);
  const remainingMonthsToGoal = Math.ceil(monthsToGoal % 12);

  const handleSaveBalance = () => {
    const parsed = parseFloat(tempBalance);
    if (!isNaN(parsed) && parsed >= 0) {
      setBankBalance(parsed);
      setIsEditingBalance(false);
    }
  };

  const handleSaveGoldPrice = () => {
    const parsed = parseFloat(tempGoldPrice);
    if (!isNaN(parsed) && parsed > 0) {
      updateGoldPrice(parsed);
      setIsEditingGoldPrice(false);
    }
  };

  const handleSaveGoldGrams = () => {
    const parsed = parseFloat(tempGoldGrams);
    if (!isNaN(parsed) && parsed >= 0) {
      updateGoldGrams(parsed);
      setIsEditingGoldGrams(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">نظرة عامة على ميزانيتك</h1>
          <p className="text-gray-500 mt-1 font-sans text-sm">أهلاً بك في لوحة تحكمك المالية. تتبع صافي ثروتك وتقدمك نحو هدفك المالي.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-amber-800 font-medium">سعر جرام الذهب عيار 24 اليوم (EUR)</div>
            <div className="flex items-center gap-2 mt-0.5">
              {isEditingGoldPrice ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={tempGoldPrice}
                    onChange={(e) => setTempGoldPrice(e.target.value)}
                    className="w-20 px-2 py-0.5 text-xs border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                    step="0.01"
                  />
                  <button onClick={handleSaveGoldPrice} className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded hover:bg-amber-700 font-medium">حفظ</button>
                </div>
              ) : (
                <>
                  <span className="font-mono font-bold text-amber-900 text-lg">€{gold.currentPricePerGram.toLocaleString()}</span>
                  <button onClick={() => setIsEditingGoldPrice(true)} className="text-xs text-amber-700 underline hover:text-amber-900">تعديل</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification for Milestone Achievements */}
      {showToast && latestAchieved && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl animate-bounce shrink-0">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <div className="text-right space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-amber-400/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  معلم مالي جديد تم تحقيقه! 🎉
                </span>
                <span className="text-[11px] text-indigo-300 font-mono">النسبة المكتملة: {progressPercentage.toFixed(1)}%</span>
              </div>
              <h4 className="text-base font-black text-white mt-1">{latestAchieved.label}</h4>
              <p className="text-xs text-slate-300 font-sans max-w-xl leading-relaxed">{latestAchieved.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => {
                alert('🎉 طقوس النجاح المالي: تم توثيق إنجازك بنجاح! استمر في الالتزام والنمو لتبلغ القمة.');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            >
              احتفل بالإنجاز 🥳
            </button>
            <button
              onClick={() => setDismissedMilestones([...dismissedMilestones, latestAchieved.percentage])}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer animate-pulse"
              title="إغلاق التنبيه"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Category Budget Overrun Alerts */}
      {activeBudgetAlerts.length > 0 && (
        <div className="space-y-3">
          {activeBudgetAlerts.map(alert => (
            <motion.div
              key={alert.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-rose-50 border border-rose-100 p-4.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center text-lg shrink-0 animate-pulse">
                  {alert.icon}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      تنبيه تجاوز الميزانية! ⚠️
                    </span>
                    <span className="text-[10px] text-rose-500 font-medium font-sans">هذا الشهر</span>
                  </div>
                  <p className="text-sm font-black text-rose-950 mt-1">
                    لقد تخطيت ميزانية <span className="underline">{alert.name}</span> بمقدار <span className="font-mono">€{alert.overage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>!
                  </p>
                  <p className="text-[11px] text-rose-700 font-sans mt-0.5">
                    الإنفاق الفعلي: <span className="font-semibold font-mono">€{alert.spent.toLocaleString()}</span> من أصل ميزانية مخططة تبلغ <span className="font-semibold font-mono">€{alert.budget.toLocaleString()}</span> ({alert.pct.toFixed(0)}%).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => startEditingCategory(alert.key, alert.budget)}
                  className="bg-white border border-rose-200 hover:bg-rose-100 text-rose-900 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  تعديل ميزانية الفئة ⚙️
                </button>
                <button
                  onClick={() => setDismissedAlerts([...dismissedAlerts, alert.key])}
                  className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-400 hover:text-rose-800 transition-all cursor-pointer"
                  title="تجاهل مؤقت"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Net Worth */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium">إجمالي الثروة (صافي الأصول)</span>
              <h3 className="text-3xl font-mono font-bold text-gray-900 mt-2">€{totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <PiggyBank className="w-6 h-6" />
            </div>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 flex items-center justify-between text-xs text-gray-500">
            <span>البنك: €{bankBalance.toLocaleString()}</span>
            <span>الذهب: €{totalGoldValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </motion.div>

        {/* Card 2: Bank Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium">الرصيد البنكي الحالي</span>
              {isEditingBalance ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={tempBalance}
                    onChange={(e) => setTempBalance(e.target.value)}
                    className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button onClick={handleSaveBalance} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-emerald-700">حفظ</button>
                  <button onClick={() => setIsEditingBalance(false)} className="text-gray-400 text-xs hover:text-gray-600">إلغاء</button>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-mono font-bold text-gray-900">€{bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  <button onClick={() => { setTempBalance(bankBalance.toString()); setIsEditingBalance(true); }} className="text-xs text-emerald-600 hover:underline">تعديل</button>
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>رصيدك النقدي السائل في الحساب البنكي</span>
          </div>
        </motion.div>

        {/* Card 3: Gold Holdings */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-xs text-gray-400 font-medium">رصيد الذهب عيار 24</span>
              {isEditingGoldGrams ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={tempGoldGrams}
                    onChange={(e) => setTempGoldGrams(e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    step="0.001"
                  />
                  <button onClick={handleSaveGoldGrams} className="bg-amber-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-amber-700 font-bold">حفظ</button>
                  <button onClick={() => setIsEditingGoldGrams(false)} className="text-gray-400 text-xs hover:text-gray-600">إلغاء</button>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-mono font-bold text-amber-600">{gold.grams.toLocaleString()} <span className="text-sm font-sans text-gray-400">جرام</span></h3>
                  <button onClick={() => { setTempGoldGrams(gold.grams.toString()); setIsEditingGoldGrams(true); }} className="text-xs text-amber-700 hover:underline">تعديل</button>
                </div>
              )}
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 flex items-center justify-between text-xs text-gray-500">
            <span>القيمة باليورو:</span>
            <span className="font-mono font-semibold text-gray-700">€{totalGoldValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </motion.div>

        {/* Card 4: Monthly Savings */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium">الادخار لهذا الشهر ({new Date().toLocaleDateString('ar-EG', { month: 'long' })})</span>
              <h3 className={`text-3xl font-mono font-bold mt-2 ${currentMonthSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {currentMonthSavings >= 0 ? '+' : ''}€{currentMonthSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className={`p-3 rounded-2xl ${currentMonthSavings >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {currentMonthSavings >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
          </div>
          <div className="border-t border-gray-50 mt-4 pt-3 flex items-center justify-between text-xs text-gray-500">
            <span>نسبة الادخار: {currentMonthSavingsRate.toFixed(1)}%</span>
            <span>الدخل: €{monthlyIncome.toLocaleString()}</span>
          </div>
        </motion.div>
      </div>

      {/* Goal Progress Section (100k Goal) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goal Indicator Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">التقدم نحو هدف الـ {goal.target.toLocaleString()} يورو</h3>
                <p className="text-xs text-gray-400">تحليل دقيق ومحاكاة للوصول للهدف الأكبر</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              المتبقي: €{remainingToGoal.toLocaleString()}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span>البداية (€0)</span>
              <span className="text-indigo-600 font-mono font-bold text-sm">{progressPercentage.toFixed(1)}% مكتمل</span>
              <span>الهدف (€{goal.target.toLocaleString()})</span>
            </div>
            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-l from-indigo-600 to-indigo-400 h-full rounded-full shadow-xs"
              />
            </div>
          </div>

          {/* Target Milestone Calculator */}
          <div className="bg-gray-50 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>معدل الادخار الشهري المفترض</span>
              </div>
              <div className="text-lg font-mono font-bold text-gray-800">
                €{monthlySavingsForCalculation.toLocaleString(undefined, { maximumFractionDigits: 0 })}/شهر
              </div>
              <div className="text-[10px] text-gray-400 font-sans">
                {averageMonthlySavings > 50 ? 'محسوب تلقائياً من معاملاتك' : 'معدل افتراضي مبدئي'}
              </div>
            </div>

            <div className="space-y-1 border-r md:border-r-0 md:border-x border-gray-200 md:px-6">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>الوقت المتبقي للهدف</span>
              </div>
              <div className="text-lg font-bold text-indigo-700">
                {yearsToGoal > 0 ? `${yearsToGoal} سنة و ${remainingMonthsToGoal} شهر` : `${remainingMonthsToGoal} أشهر`}
              </div>
              <div className="text-[10px] text-indigo-500 font-sans font-medium">
                بناءً على متوسط مدخراتك الحالي
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>كيف تسرّع الوصول؟</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                بزيادة ادخارك بمقدار <span className="font-bold text-emerald-600">€100</span> شهرياً فقط، ستقلص مدة الانتظار بحوالي <span className="font-bold text-emerald-600">
                  {Math.max(1, Math.round(monthsToGoal - (remainingToGoal / (monthlySavingsForCalculation + 100))))} أشهر
                </span>!
              </p>
            </div>
          </div>

          {/* Milestone Achievements Road */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                معالم الطريق المنجزة والمستهدفة (بناء الثروة)
              </h4>
              <span className="text-[10px] text-gray-400 font-sans">تحديث فوري مع زيادة مدخراتك</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {milestones.map((milestone) => {
                const isAchieved = progressPercentage >= milestone.percentage;
                return (
                  <div
                    key={milestone.percentage}
                    className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isAchieved
                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950 shadow-xs'
                        : 'bg-slate-50/40 border-slate-100 text-slate-400'
                    }`}
                  >
                    {isAchieved && (
                      <div className="absolute top-0 left-0 bg-emerald-500 text-white p-1 rounded-br-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold ${isAchieved ? 'text-emerald-800' : 'text-slate-500'}`}>
                          {milestone.percentage}%
                        </span>
                        <span className="text-[9px] font-mono opacity-85">
                          (€{(milestone.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-tight ${isAchieved ? 'text-emerald-950 font-black' : 'text-slate-700'}`}>
                        {milestone.label.split(': ')[1] || milestone.label}
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-500 font-sans mt-2.5 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wealth Distribution / Insights Panel */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">توزيع أصولك الحالية</h3>
              <p className="text-xs text-gray-400">مدى تنوع محفظتك بين الكاش والذهب</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Bank cash slice */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-medium">الحساب البنكي (سيولة نقدية)</span>
                <span className="font-mono font-bold text-gray-800">{totalNetWorth > 0 ? ((bankBalance / totalNetWorth) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalNetWorth > 0 ? (bankBalance / totalNetWorth) * 100 : 0}%` }} />
              </div>
              <div className="text-[10px] text-gray-400">تمنحك الأمان والقدرة على سداد المصاريف اليومية فوراً.</div>
            </div>

            {/* Gold slice */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-amber-700 font-medium">الذهب عيار 24 (أصول مخزنة)</span>
                <span className="font-mono font-bold text-amber-800">{totalNetWorth > 0 ? ((totalGoldValue / totalNetWorth) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalNetWorth > 0 ? (totalGoldValue / totalNetWorth) * 100 : 0}%` }} />
              </div>
              <div className="text-[10px] text-gray-400">يحمي مدخراتك من التضخم ويعتبر ملاذاً آمناً للأموال طويلة المدى.</div>
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-xs text-amber-900 leading-relaxed font-sans">
            <span className="font-bold">نصيحة مالية:</span> توزيع الأصول بنسبة متوازنة (مثلاً 70% كاش في البنك للمصاريف والفرص الاستثمارية و 30% ذهب لحفظ القيمة) يعزز أمانك المالي واستقرارك على المدى البعيد.
          </div>
        </div>
      </div>

      {/* Category Budget Tracker Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-50 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <PiggyBank className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-900">الميزانيات الشهرية المخططة لكل فئة</h3>
              <p className="text-xs text-gray-400">تحكم بحدود إنفاقك الشهري لزيادة فوائض الادخار وتحقيق الأهداف بشكل أسرع.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl">
            <div className="text-xs text-slate-500 font-medium px-2">
              إجمالي الميزانيات المحددة:{' '}
              <span className="font-mono font-bold text-slate-900">
                €{Object.values(categoryBudgets).reduce((sum, b) => sum + b, 0).toLocaleString()}
              </span>
            </div>
            {Object.keys(currentMonthExpensesByCategory).length > 0 && (
              <div className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-xl">
                إجمالي المصاريف الفعلية هذا الشهر:{' '}
                <span className="font-mono">
                  €{Object.values(currentMonthExpensesByCategory).reduce((sum, a) => sum + a, 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.keys(EXPENSE_CATEGORIES_AR).map((key) => {
            const catInfo = EXPENSE_CATEGORIES_AR[key];
            const spent = currentMonthExpensesByCategory[key] || 0;
            const budget = categoryBudgets[key] || 0;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            const isEditing = editingCategory === key;
            
            // Color mapping based on usage
            let progressColor = 'bg-emerald-500';
            let textColor = 'text-emerald-700';
            let bgLight = 'bg-emerald-50/20';
            let borderStyle = 'border-slate-100';

            if (pct >= 100) {
              progressColor = 'bg-rose-500 animate-pulse';
              textColor = 'text-rose-700 font-bold';
              bgLight = 'bg-rose-50/50';
              borderStyle = 'border-rose-100 ring-1 ring-rose-500/10';
            } else if (pct >= 80) {
              progressColor = 'bg-amber-500';
              textColor = 'text-amber-700 font-bold';
              bgLight = 'bg-amber-50/40';
              borderStyle = 'border-amber-100';
            }

            return (
              <div
                key={key}
                className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between ${bgLight} ${borderStyle}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xl bg-white p-1.5 rounded-xl shadow-xs border border-slate-100">
                      {catInfo.icon}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      pct >= 100 ? 'bg-rose-100 text-rose-800' : pct >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {pct >= 100 ? 'تجاوزت الحد! ⚠️' : pct >= 80 ? 'قريب من الحد ⚠️' : 'تحت السيطرة ✅'}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-800 mb-1 text-right">{catInfo.name}</h4>
                  
                  {/* Spent vs Budget amount */}
                  <div className="flex justify-between items-baseline text-xs mt-2.5 mb-1.5">
                    <span className="text-slate-500 font-medium">الإنفاق الفعلي:</span>
                    <span className="font-mono font-bold text-slate-900">€{spent.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-slate-200/60 mb-3.5">
                    <span className="text-slate-500 font-medium">الميزانية المرصودة:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-16 px-1.5 py-0.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCategoryBudget(key);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveCategoryBudget(key)}
                          className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded hover:bg-indigo-700 font-bold"
                        >
                          حفظ
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-950">€{budget.toLocaleString()}</span>
                        <button
                          onClick={() => startEditingCategory(key, budget)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          تعديل
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-sans text-slate-400">
                    <span>نسبة الإنفاق: {pct.toFixed(0)}%</span>
                    {budget > 0 && spent > budget && (
                      <span className="text-rose-600 font-bold">تجاوزت بـ €{(spent - budget).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative budget alert guidance */}
        <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-start gap-3 text-xs text-slate-600 leading-relaxed font-sans text-right">
          <span className="text-lg">💡</span>
          <div>
            <span className="font-bold text-slate-800">نصيحة مالية ذكية للتحكم بالميزانية:</span>
            {' '}تعتمد استراتيجية الادخار الناجحة على طريقة "ادفع لنفسك أولاً" عن طريق شراء الذهب أو تحويل فائض الراتب للادخار بمجرد استلامه، ومن ثم توزيع بقية المبلغ على الميزانيات المذكورة أعلاه. تذكر أن مراقبة ميزانيات الفئات يومياً تمنع الاستنزاف المالي غير المدروس للمصاريف النثرية!
          </div>
        </div>
      </motion.div>
    </div>
  );
}
