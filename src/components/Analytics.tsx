import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  FileText, 
  PieChart as PieIcon, 
  BarChart2, 
  TrendingUp as TrendIcon 
} from 'lucide-react';
import { Transaction } from '../types';

interface AnalyticsProps {
  transactions: Transaction[];
  isPremium?: boolean;
  onGoToBilling?: () => void;
}

const COLORS = [
  '#f43f5e', // Rent (rose)
  '#f97316', // Groceries (orange)
  '#3b82f6', // Utilities (blue)
  '#6366f1', // Transportation (indigo)
  '#14b8a6', // Health (teal)
  '#ec4899', // Entertainment (pink)
  '#d97706', // Gold Buy (amber)
  '#6b7280'  // Other (gray)
];

const CATEGORY_NAMES_AR: { [key: string]: string } = {
  rent: 'إيجار وسكن',
  groceries: 'طعام ومواد غذائية',
  utilities: 'فواتير ومرافق (كهرباء/إنترنت)',
  transportation: 'مواصلات وسيارات',
  health: 'صحة وعلاج وتأمين',
  entertainment: 'ترفيه وسفر وهدايا',
  gold_buy: 'شراء ذهب عيار 24',
  other_expense: 'مصاريف أخرى',
  salary: 'الراتب الأساسي',
  investment: 'عوائد واستثمارات',
  freelance: 'عمل حر / دخل إضافي',
  gold_sell: 'بيع ذهب عيار 24',
  other_income: 'مصادر أخرى'
};

export default function Analytics({ transactions, isPremium, onGoToBilling }: AnalyticsProps) {
  // 1. Total Expenses & Income
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = totalIncome - totalExpense;
  const averageSavingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  // 2. Expense by Category Breakdown
  const expenseByCategory: { [key: string]: number } = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const pieData = Object.keys(expenseByCategory).map((catId, index) => ({
    name: CATEGORY_NAMES_AR[catId] || catId,
    value: expenseByCategory[catId],
    color: COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  // 3. Monthly Trend Data (Income vs Expense vs Savings)
  const monthlyDataMap: { [key: string]: { income: number; expense: number; savings: number } } = {};
  
  // Sort transactions by date first to keep month order
  const sortedTransactions = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  
  sortedTransactions.forEach(t => {
    const month = t.date.substring(0, 7); // e.g. "2026-06"
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { income: 0, expense: 0, savings: 0 };
    }
    if (t.type === 'income') {
      monthlyDataMap[month].income += t.amount;
    } else {
      monthlyDataMap[month].expense += t.amount;
    }
    monthlyDataMap[month].savings = monthlyDataMap[month].income - monthlyDataMap[month].expense;
  });

  const monthlyChartData = Object.keys(monthlyDataMap).map(month => {
    // Format Month name in Arabic if possible, or keep simple (e.g., "06-2026")
    const [year, mNum] = month.split('-');
    const formattedMonth = `${mNum}/${year}`;
    return {
      month: formattedMonth,
      الدخل: monthlyDataMap[month].income,
      المصاريف: monthlyDataMap[month].expense,
      الادخار: monthlyDataMap[month].savings
    };
  });

  // 4. Period-based Budget Comparison (Days vs Weeks vs Months vs Years)
  const [activePeriod, setActivePeriod] = React.useState<'days' | 'weeks' | 'months' | 'years'>('months');
  
  // Custom threshold limits for visual comparisons (default target guidelines)
  const budgetLimits = {
    days: 120,    // Recommended daily cap €120
    weeks: 800,   // Recommended weekly cap €800
    months: 3200, // Recommended monthly cap €3200
    years: 38000  // Recommended yearly cap €38000
  };

  // Grouping math for periods:
  // Days
  const dailyDataMap: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach(t => {
    const key = t.date; // "YYYY-MM-DD"
    if (!dailyDataMap[key]) dailyDataMap[key] = { income: 0, expense: 0 };
    if (t.type === 'income') dailyDataMap[key].income += t.amount;
    else dailyDataMap[key].expense += t.amount;
  });

  // Weeks
  const weeklyDataMap: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach(t => {
    const dateObj = new Date(t.date);
    const oneJan = new Date(dateObj.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((dateObj.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    const key = `${dateObj.getFullYear()}-W${weekNum}`;
    
    if (!weeklyDataMap[key]) weeklyDataMap[key] = { income: 0, expense: 0 };
    if (t.type === 'income') weeklyDataMap[key].income += t.amount;
    else weeklyDataMap[key].expense += t.amount;
  });

  // Years
  const yearlyDataMap: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach(t => {
    const key = t.date.substring(0, 4); // "YYYY"
    if (!yearlyDataMap[key]) yearlyDataMap[key] = { income: 0, expense: 0 };
    if (t.type === 'income') yearlyDataMap[key].income += t.amount;
    else yearlyDataMap[key].expense += t.amount;
  });

  // Get current statistics according to activePeriod
  const getPeriodStats = () => {
    let currentMap: { [key: string]: { income: number; expense: number } } = {};
    let limit = 0;
    let label = '';
    
    if (activePeriod === 'days') {
      currentMap = dailyDataMap;
      limit = budgetLimits.days;
      label = 'يومي';
    } else if (activePeriod === 'weeks') {
      currentMap = weeklyDataMap;
      limit = budgetLimits.weeks;
      label = 'أسبوعي';
    } else if (activePeriod === 'months') {
      currentMap = monthlyDataMap; 
      limit = budgetLimits.months;
      label = 'شهري';
    } else {
      currentMap = yearlyDataMap;
      limit = budgetLimits.years;
      label = 'سنوي';
    }

    const keys = Object.keys(currentMap);
    if (keys.length === 0) {
      return { items: [], averageExpense: 0, maxExpense: 0, limit, label };
    }

    const items = keys.map(k => {
      const inc = currentMap[k].income;
      const exp = currentMap[k].expense;
      return {
        periodKey: k,
        income: inc,
        expense: exp,
        savings: inc - exp,
        percentOfLimit: limit > 0 ? (exp / limit) * 100 : 0
      };
    }).sort((a, b) => b.periodKey.localeCompare(a.periodKey)); // Newest first

    const totalExp = items.reduce((sum, item) => sum + item.expense, 0);
    const averageExpense = totalExp / items.length;
    const maxExpense = Math.max(...items.map(i => i.expense));

    return { items, averageExpense, maxExpense, limit, label };
  };

  const periodStats = getPeriodStats();

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التقارير المالية والتحليلات التفصيلية</h2>
          <p className="text-sm text-gray-500 mt-1 font-sans">توزيع دقيق يوضح مصادر دخلك ومواضع مصاريفك ونمو مدخراتك شهراً بشهر</p>
        </div>
        
        {/* Export Report PDF Premium Trigger */}
        <button
          onClick={onGoToBilling}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm shrink-0 border ${
            isPremium 
              ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700 text-white shadow-emerald-600/10 cursor-pointer' 
              : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-700 text-white shadow-indigo-600/10 cursor-pointer'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isPremium ? 'منشئ ومصدّر تقارير PDF 👑' : 'تصدير التقارير كـ PDF 👑'}</span>
        </button>
      </div>

      {/* Highlights metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-emerald-800 font-bold">إجمالي التدفقات الواردة (الدخل)</span>
            <div className="text-2xl font-mono font-bold text-emerald-700">€{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="p-3 bg-emerald-500 text-white rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-rose-800 font-bold">إجمالي التدفقات الخارجة (المصاريف)</span>
            <div className="text-2xl font-mono font-bold text-rose-700">€{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="p-3 bg-rose-500 text-white rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-indigo-800 font-bold">معدل الادخار التاريخي العام</span>
            <div className="text-2xl font-mono font-bold text-indigo-700">{averageSavingsRate.toFixed(1)}%</div>
          </div>
          <div className="p-3 bg-indigo-500 text-white rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Budget/Muwazana Period comparison (Days vs Weeks vs Months vs Years) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">موازنة ومقارنة الفترات الدورية</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">تتبع الالتزام بحدود الإنفاق الموصى بها والمقارنة التلقائية للمصاريف والادخار</p>
          </div>
          
          {/* Toggle Tabs */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
            <button
              onClick={() => setActivePeriod('days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePeriod === 'days' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              يومي
            </button>
            <button
              onClick={() => setActivePeriod('weeks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePeriod === 'weeks' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              أسبوعي
            </button>
            <button
              onClick={() => setActivePeriod('months')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePeriod === 'months' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setActivePeriod('years')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePeriod === 'years' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              سنوي
            </button>
          </div>
        </div>

        {/* Quick Insights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block">معدل نفقاتك الـ {periodStats.label}</span>
            <div className="text-lg font-mono font-bold text-gray-800 mt-1">€{periodStats.averageExpense.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">محسوب عبر كل السجلات</p>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block">الحد الأقصى للنفقات ({periodStats.label})</span>
            <div className="text-lg font-mono font-bold text-rose-600 mt-1">€{periodStats.maxExpense.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">أعلى إنفاق تم تسجيله</p>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block">سقف الموازنة الموصى به ({periodStats.label})</span>
            <div className="text-lg font-mono font-bold text-indigo-600 mt-1">€{periodStats.limit.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">سقف الأمان المالي المحدد</p>
          </div>
        </div>

        {/* Periodic Table & Visual budget progress lines */}
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {periodStats.items.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">لا توجد سجلات مالية كافية لحساب الموازنة الدورية.</div>
          ) : (
            periodStats.items.map((item, idx) => {
              const isOverBudget = item.expense > periodStats.limit;
              
              return (
                <div key={idx} className="p-4 bg-gray-50/40 border border-gray-100 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-mono font-bold">
                        {item.periodKey}
                      </span>
                      <span className="text-[10px] text-gray-400 font-sans">
                        صافي الادخار بالفترة: <span className={`font-bold ${item.savings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>€{item.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-gray-800">
                        €{item.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-gray-400 font-sans"> / €{periodStats.limit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Budget Progress bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-550 ${
                        isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${Math.min(item.percentOfLimit, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">نسبة استهلاك الميزانية: <span className="font-bold text-gray-700">{item.percentOfLimit.toFixed(1)}%</span></span>
                    {isOverBudget ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">⚠️ تجاوزت سقف الموازنة المحددة!</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">✓ الميزانية آمنة وضمن الحدود الموصى بها</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Expense Breakdown Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-gray-900">تفاصيل مصاريفك: أين تذهب الأموال؟</h3>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-sans">
                الرجاء تسجيل بعض المصاريف أولاً لعرض المخطط البياني.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'القيمة']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Detailed Category Table List next to pie chart to solve RTL issues and give precise figures */}
          <div className="space-y-2 max-h-48 overflow-y-auto pt-2 border-t border-gray-50 pr-1">
            {pieData.map((item, index) => {
              const percent = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-gray-800 font-bold">€{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="font-mono text-gray-400">({percent.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Income vs Expense Trend Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900">مقارنة الدخل والمصاريف شهرياً</h3>
          </div>

          <div className="h-80 w-full pt-4">
            {monthlyChartData.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-xs font-sans">
                الرجاء إدخال بيانات ميزانية لبدء عرض المنحنى التاريخي للمصاريف والدخل.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(value: number) => [`€${value.toLocaleString()}`]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="الدخل" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المصاريف" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Savings Progression Area Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <TrendIcon className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-900">اتجاه وصافي الادخار الشهري</h3>
          </div>

          <div className="h-64 w-full pt-4">
            {monthlyChartData.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-xs font-sans">
                سيعرض هذا المخطط تراكم ونمو مدخراتك الصافية بمرور الأشهر.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(value: number) => [`€${value.toLocaleString()}`, 'صافي الادخار']} />
                  <Area type="monotone" dataKey="الادخار" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
