import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Coins, 
  DownloadCloud, 
  Github,
  Wallet,
  Calculator,
  Target,
  User,
  LogOut,
  Sparkles,
  Award
} from 'lucide-react';
import { AppData, Transaction, GoldState, SavingsGoal } from './types';
import Dashboard from './components/Dashboard';
import Ledger from './components/Ledger';
import Analytics from './components/Analytics';
import GoldTracker from './components/GoldTracker';
import DeploymentGuide from './components/DeploymentGuide';
import LandingPage from './components/LandingPage';
import AiAdvisor from './components/AiAdvisor';
import SaaSModule from './components/SaaSModule';

const LOCAL_STORAGE_KEY = 'gold_savings_tracker_data_v2';

// Realistic starter data for a professional look from day one
const DEFAULT_APP_DATA: AppData = {
  transactions: [
    {
      id: 'init-1',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().substring(0, 10), // 10 days ago
      type: 'income',
      amount: 4200.00,
      category: 'salary',
      description: 'الراتب الشهري الأساسي',
      account: 'bank'
    },
    {
      id: 'init-2',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString().substring(0, 10), // 9 days ago
      type: 'expense',
      amount: 1100.00,
      category: 'rent',
      description: 'إيجار شقة السكن لشهر يونيو',
      account: 'bank'
    },
    {
      id: 'init-3',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().substring(0, 10), // 7 days ago
      type: 'expense',
      amount: 150.00,
      category: 'utilities',
      description: 'فاتورة الكهرباء والغاز والانترنت والماء',
      account: 'bank'
    },
    {
      id: 'init-4',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().substring(0, 10), // 5 days ago
      type: 'expense',
      amount: 750.00,
      category: 'gold_buy',
      description: 'ادخار وشراء سبيكة ذهب عيار 24',
      account: 'gold_purchase',
      goldGrams: 10
    },
    {
      id: 'init-5',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().substring(0, 10), // 2 days ago
      type: 'expense',
      amount: 220.00,
      category: 'groceries',
      description: 'مقاضي ومواد غذائية ولحوم للبيت',
      account: 'bank'
    }
  ],
  gold: {
    grams: 10.0,
    currentPricePerGram: 75.0 // ~ €75 per gram of 24k gold
  },
  bankBalance: 1980.00, // Starting bank balance (€4200 - €1100 - €150 - €750 - €220)
  goal: {
    target: 100000,
    title: 'توفير مئة ألف يورو'
  },
  categoryBudgets: {
    rent: 1200,
    groceries: 400,
    utilities: 200,
    transportation: 150,
    health: 100,
    entertainment: 250,
    gold_buy: 1000,
    other_expense: 300
  }
};

export default function App() {
  const [appData, setAppData] = useState<AppData>(DEFAULT_APP_DATA);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'analytics' | 'gold' | 'guide' | 'ai' | 'billing'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [dbUserId, setDbUserId] = useState<number | null>(null);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Check database connectivity on mount
  useEffect(() => {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => {
        setIsDbConnected(data.connected);
      })
      .catch(() => setIsDbConnected(false));
  }, []);

  // Load from local storage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('gold_savings_user_email');
    const savedUserId = localStorage.getItem('gold_savings_user_id');
    if (savedEmail) {
      setIsLoggedIn(true);
      setUserEmail(savedEmail);
    }
    if (savedUserId) {
      setDbUserId(Number(savedUserId));
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.transactions)) {
          // Robust merge with DEFAULT_APP_DATA to prevent crashes from missing fields (e.g. gold, goal, categoryBudgets)
          const merged: AppData = {
            ...DEFAULT_APP_DATA,
            ...parsed,
            gold: {
              ...DEFAULT_APP_DATA.gold,
              ...(parsed.gold || {})
            },
            goal: {
              ...DEFAULT_APP_DATA.goal,
              ...(parsed.goal || {})
            },
            categoryBudgets: {
              ...DEFAULT_APP_DATA.categoryBudgets,
              ...(parsed.categoryBudgets || {})
            }
          };
          setAppData(merged);
        }
      } catch (e) {
        console.error('Failed to load local storage state', e);
      }
    }
  }, []);

  // Save to local storage and sync to MySQL when state changes
  const saveStateToLocalStorage = (newData: AppData, forceUserId?: number | null) => {
    setAppData(newData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));

    const activeUserId = forceUserId !== undefined ? forceUserId : dbUserId;
    if (activeUserId) {
      fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, state: newData })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('☁️ State synchronized with MySQL server database!');
        }
      })
      .catch(err => console.warn('⚠️ Sync failed:', err));
    }
  };

  const handleLogin = (email: string, userId?: number, remoteState?: AppData) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('gold_savings_user_email', email);
    
    if (userId && remoteState) {
      setDbUserId(userId);
      localStorage.setItem('gold_savings_user_id', String(userId));
      // Overwrite local state with database state
      saveStateToLocalStorage(remoteState, userId);
    } else {
      setDbUserId(null);
      localStorage.removeItem('gold_savings_user_id');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setDbUserId(null);
    localStorage.removeItem('gold_savings_user_email');
    localStorage.removeItem('gold_savings_user_id');
  };

  // Add Transaction & Update Bank and Gold balance automatically
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const id = 'tx-' + Math.random().toString(36).substring(2, 9);
    const transaction: Transaction = { ...newTx, id };

    // Calculate new bank and gold balances
    let finalBankBalance = appData.bankBalance;
    let finalGoldGrams = appData.gold.grams;

    if (transaction.type === 'income') {
      finalBankBalance += transaction.amount;
      
      // If it is selling gold, deduct gold grams
      if (transaction.category === 'gold_sell' && transaction.goldGrams) {
        finalGoldGrams = Math.max(0, finalGoldGrams - transaction.goldGrams);
      }
    } else {
      finalBankBalance -= transaction.amount;

      // If it is buying gold, add gold grams
      if (transaction.category === 'gold_buy' && transaction.goldGrams) {
        finalGoldGrams += transaction.goldGrams;
      }
    }

    const updatedData: AppData = {
      ...appData,
      transactions: [transaction, ...appData.transactions],
      bankBalance: finalBankBalance,
      gold: {
        ...appData.gold,
        grams: finalGoldGrams
      }
    };

    saveStateToLocalStorage(updatedData);
  };

  // Delete Transaction & Revert changes automatically
  const handleDeleteTransaction = (id: string) => {
    const txToDelete = appData.transactions.find(t => t.id === id);
    if (!txToDelete) return;

    let finalBankBalance = appData.bankBalance;
    let finalGoldGrams = appData.gold.grams;

    // Reverse the transactions effects
    if (txToDelete.type === 'income') {
      finalBankBalance -= txToDelete.amount;

      // If it was selling gold, add back the grams to inventory
      if (txToDelete.category === 'gold_sell' && txToDelete.goldGrams) {
        finalGoldGrams += txToDelete.goldGrams;
      }
    } else {
      finalBankBalance += txToDelete.amount;

      // If it was buying gold, deduct the grams from inventory
      if (txToDelete.category === 'gold_buy' && txToDelete.goldGrams) {
        finalGoldGrams = Math.max(0, finalGoldGrams - txToDelete.goldGrams);
      }
    }

    const updatedData: AppData = {
      ...appData,
      transactions: appData.transactions.filter(t => t.id !== id),
      bankBalance: finalBankBalance,
      gold: {
        ...appData.gold,
        grams: finalGoldGrams
      }
    };

    saveStateToLocalStorage(updatedData);
  };

  const handleSetBankBalance = (newBalance: number) => {
    const updated = {
      ...appData,
      bankBalance: newBalance
    };
    saveStateToLocalStorage(updated);
  };

  const handleUpdateGoldPrice = (newPrice: number) => {
    const updated = {
      ...appData,
      gold: {
        ...appData.gold,
        currentPricePerGram: newPrice
      }
    };
    saveStateToLocalStorage(updated);
  };

  const handleUpdateGoldGrams = (newGrams: number) => {
    const updated = {
      ...appData,
      gold: {
        ...appData.gold,
        grams: newGrams
      }
    };
    saveStateToLocalStorage(updated);
  };

  const handleUpdateCategoryBudgets = (category: string, limit: number) => {
    const updated = {
      ...appData,
      categoryBudgets: {
        ...(appData.categoryBudgets || {}),
        [category]: limit
      }
    };
    saveStateToLocalStorage(updated);
  };

  const handleUpdateSaaSTier = (tier: 'free' | 'monthly' | 'lifetime') => {
    const updated = {
      ...appData,
      premiumTier: tier,
      subscriptionActive: tier !== 'free'
    };
    saveStateToLocalStorage(updated);
  };

  const handleImportBackup = (importedData: AppData) => {
    saveStateToLocalStorage(importedData);
  };

  if (!isLoggedIn) {
    return <LandingPage onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row-reverse font-sans" dir="rtl">
      
      {/* Sidebar - Visible on Desktop, Hidden on Mobile */}
      <aside className="hidden md:flex w-72 bg-[#0F172A] text-white flex-col shrink-0 border-l border-slate-800">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0B1222]">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-2.5 rounded-xl shadow-lg shadow-amber-500/10">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-1">
                حصّالة الذهب والادخار
              </h1>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[10px] font-sans font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                  الهدف: €100K
                </span>
                {isDbConnected ? (
                  <span className="text-[9px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block" title="بياناتك مشفرة ومحفوظة تلقائياً في السحاب">
                    سحابي ☁️
                  </span>
                ) : (
                  <span className="text-[9px] font-sans font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-md inline-block" title="يتم حفظ البيانات محلياً في المتصفح فقط">
                    محلي 💾
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 border-r-4 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            لوحة التحكم المالية
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 border-r-4 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            سجل اليوميات والمصاريف
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 border-r-4 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            تقارير المصاريف والادخار
          </button>

          <button
            onClick={() => setActiveTab('gold')}
            className={`w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 ${
              activeTab === 'gold'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 border-r-4 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            تفاصيل ومخزون الذهب عيار 24
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 border-r-4 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            الرفع على Hostinger
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 ${
              activeTab === 'ai'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15 border-r-4 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            المستشار المالي الذكي (AI)
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 ${
              activeTab === 'billing'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/15 border-r-4 border-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400 animate-pulse" />
            الاشتراك وتصدير PDF 👑
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 mt-6"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج الآمن
          </button>
        </nav>

        {/* Progress Footer */}
        <div className="p-6 border-t border-slate-800 bg-[#0B1222] space-y-2">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>نسبة إنجاز الهدف (€100K)</span>
            <span className="font-mono text-amber-400">{(((appData.bankBalance + (appData.gold.grams * appData.gold.currentPricePerGram)) / appData.goal.target) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, (((appData.bankBalance + (appData.gold.grams * appData.gold.currentPricePerGram)) / appData.goal.target) * 100))}%` }} 
            />
          </div>
          <p className="text-[10px] text-slate-500 text-center font-sans mt-2">نظام الإدارة المالية الشخصي v2.4</p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header and Compact Nav */}
        <header className="md:hidden bg-[#0F172A] text-white p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <h1 className="font-bold text-sm">حصّالة الذهب والادخار</h1>
            </div>
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded font-mono text-amber-400">
              هدف €100K: {(((appData.bankBalance + (appData.gold.grams * appData.gold.currentPricePerGram)) / appData.goal.target) * 100).toFixed(1)}%
            </span>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'}`}
            >
              لوحة التحكم
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${activeTab === 'ledger' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'}`}
            >
              سجل اليوميات
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'}`}
            >
              التقارير
            </button>
            <button
              onClick={() => setActiveTab('gold')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${activeTab === 'gold' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'}`}
            >
              الذهب عيار 24
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'}`}
            >
              المستشار الذكي (AI)
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${activeTab === 'billing' ? 'bg-amber-600 text-white' : 'text-slate-400 bg-slate-900'}`}
            >
              الاشتراك والـ PDF 👑
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${activeTab === 'guide' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'}`}
            >
              الرفع على هوستنجر
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg shrink-0 font-bold text-rose-400 bg-rose-500/10"
            >
              خروج
            </button>
          </nav>
        </header>

        {/* Global Desktop Header */}
        <div className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0">
          <div className="text-slate-500 text-xs font-semibold">
            حصالة الذهب والادخار الذكية • نظرة عامة شاملة ودقيقة على مدخراتك وأصولك الاستثمارية
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">حساب المستثمر الخاص</p>
              <p className="text-[10px] text-emerald-600 font-medium">الحساب آمن ومستضاف محلياً</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              AD
            </div>
          </div>
        </div>

        {/* Real-time Status ribbon */}
        <div className="bg-blue-50 border-b border-blue-100 py-2 px-6 md:px-12 flex justify-between items-center text-[11px] text-blue-900">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span>نظام حساباتي الشخصية مفعّل • حساب سائل البنك والذهب باليورو بدقة كاملة</span>
          </div>
          <span className="font-mono text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded font-semibold">
            صافي الثروة الحالي: €{(appData.bankBalance + (appData.gold.grams * appData.gold.currentPricePerGram)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Main Workspace content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              transactions={appData.transactions}
              gold={appData.gold}
              bankBalance={appData.bankBalance}
              goal={appData.goal}
              setBankBalance={handleSetBankBalance}
              updateGoldPrice={handleUpdateGoldPrice}
              updateGoldGrams={handleUpdateGoldGrams}
              categoryBudgets={appData.categoryBudgets || {}}
              onUpdateCategoryBudget={handleUpdateCategoryBudgets}
            />
          )}

          {activeTab === 'ledger' && (
            <Ledger
              transactions={appData.transactions}
              gold={appData.gold}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              transactions={appData.transactions}
              isPremium={appData.premiumTier !== undefined && appData.premiumTier !== 'free'}
              onGoToBilling={() => setActiveTab('billing')}
            />
          )}

          {activeTab === 'billing' && (
            <SaaSModule
              appData={appData}
              onUpdateSaaSTier={handleUpdateSaaSTier}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'gold' && (
            <GoldTracker
              gold={appData.gold}
              transactions={appData.transactions}
              updateGoldPrice={handleUpdateGoldPrice}
              updateGoldGrams={handleUpdateGoldGrams}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'guide' && (
            <DeploymentGuide
              appData={appData}
              onImportData={handleImportBackup}
            />
          )}

          {activeTab === 'ai' && (
            <AiAdvisor
              appData={appData}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-[11px] text-slate-400 font-sans">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <p>حصالة الذهب والادخار © {new Date().getFullYear()} • كافة العمليات آمنة بخصوصية مطلقة ولا يتم إرسالها لأي خادم خارجي.</p>
            <div className="flex gap-4">
              <span>متوافق تماماً مع استضافات هوستنجر Hostinger</span>
              <span>•</span>
              <span className="text-amber-600 font-bold">عيار 24 قيراط</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
