import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Tag,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Transaction, GoldState } from '../types';

interface LedgerProps {
  transactions: Transaction[];
  gold: GoldState;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  customCategories?: { id: string; name: string; color: string }[];
  customIncomeCategories?: { id: string; name: string; color: string }[];
  onAddCustomCategory?: (name: string, type: 'income' | 'expense') => void;
  onEditCustomCategory?: (id: string, name: string, type: 'income' | 'expense') => void;
  onDeleteCustomCategory?: (id: string, type: 'income' | 'expense') => void;
}

const EXPENSE_CATEGORIES = [
  { id: 'rent', name: 'إيجار وسكن', color: 'bg-red-50 text-red-700' },
  { id: 'groceries', name: 'طعام ومواد غذائية', color: 'bg-orange-50 text-orange-700' },
  { id: 'utilities', name: 'فواتير ومرافق (كهرباء/إنترنت)', color: 'bg-blue-50 text-blue-700' },
  { id: 'transportation', name: 'مواصلات وسيارات', color: 'bg-indigo-50 text-indigo-700' },
  { id: 'health', name: 'صحة وعلاج وتأمين', color: 'bg-teal-50 text-teal-700' },
  { id: 'entertainment', name: 'ترفيه وسفر وهدايا', color: 'bg-pink-50 text-pink-700' },
  { id: 'education', name: 'تعليم ودراسة', color: 'bg-purple-50 text-purple-700' },
  { id: 'shopping', name: 'تسوق وملابس', color: 'bg-fuchsia-50 text-fuchsia-700' },
  { id: 'dining', name: 'مطاعم ومقاهي', color: 'bg-yellow-50 text-yellow-800' },
  { id: 'gold_buy', name: 'شراء ذهب عيار 24', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { id: 'transfer_to_bank', name: 'تحويل إلى حساب البنك 📥', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { id: 'other_expense', name: 'مصاريف أخرى', color: 'bg-gray-50 text-gray-700' }
];

const INCOME_CATEGORIES = [
  { id: 'salary', name: 'الراتب الأساسي', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'investment', name: 'عوائد واستثمارات', color: 'bg-cyan-50 text-cyan-700' },
  { id: 'freelance', name: 'عمل حر / دخل إضافي', color: 'bg-purple-50 text-purple-700' },
  { id: 'gifts', name: 'هدايا ومكافآت', color: 'bg-pink-50 text-pink-700' },
  { id: 'gold_sell', name: 'بيع ذهب عيار 24', color: 'bg-amber-50 text-amber-800 border border-amber-200' },
  { id: 'transfer_to_cash', name: 'تحويل إلى الكاش المتوفر 📤', color: 'bg-teal-50 text-teal-700 border border-teal-200' },
  { id: 'other_income', name: 'مصادر أخرى', color: 'bg-gray-50 text-gray-700' }
];

export default function Ledger({
  transactions,
  gold,
  onAddTransaction,
  onDeleteTransaction,
  customCategories = [],
  customIncomeCategories = [],
  onAddCustomCategory,
  onEditCustomCategory,
  onDeleteCustomCategory
}: LedgerProps) {
  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('card');
  const [goldGrams, setGoldGrams] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Category State
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Combined categories list for expense
  const expenseCategoriesList = [
    ...EXPENSE_CATEGORIES,
    ...(customCategories || [])
  ];

  // Combined categories list for income
  const incomeCategoriesList = [
    ...INCOME_CATEGORIES,
    ...(customIncomeCategories || [])
  ];

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  // Sync category options with selected type
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id);
    setGoldGrams('');
    setErrorMsg('');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setCategory(cat);
    
    // Auto-calculate suggested gold grams based on current gold price
    if (cat === 'gold_buy' || cat === 'gold_sell') {
      const amt = parseFloat(amount);
      if (amt && gold.currentPricePerGram > 0) {
        const grams = (amt / gold.currentPricePerGram).toFixed(3);
        setGoldGrams(grams);
      }
    } else {
      setGoldGrams('');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amt = e.target.value;
    setAmount(amt);
    
    // Auto-update gold grams calculation
    if (category === 'gold_buy' || category === 'gold_sell') {
      const val = parseFloat(amt);
      if (val && gold.currentPricePerGram > 0) {
        setGoldGrams((val / gold.currentPricePerGram).toFixed(3));
      } else {
        setGoldGrams('');
      }
    }
  };

  const handleGoldGramsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const grams = e.target.value;
    setGoldGrams(grams);
    
    // Auto-update amount calculation based on gold grams * gold price
    const gVal = parseFloat(grams);
    if (gVal && gold.currentPricePerGram > 0 && (category === 'gold_buy' || category === 'gold_sell')) {
      setAmount((gVal * gold.currentPricePerGram).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    let grams: number | undefined = undefined;
    if (category === 'gold_buy' || category === 'gold_sell') {
      const parsedGrams = parseFloat(goldGrams);
      if (isNaN(parsedGrams) || parsedGrams <= 0) {
        setErrorMsg('الرجاء تحديد كمية الذهب بالجرام بشكل صحيح.');
        return;
      }
      
      // If selling gold, verify we actually have enough gold grams in balance
      if (category === 'gold_sell' && parsedGrams > gold.grams) {
        setErrorMsg(`عذراً، رصيدك الحالي من الذهب (${gold.grams} جرام) غير كافٍ لإجراء هذه المعاملة.`);
        return;
      }
      grams = parsedGrams;
    }

    let finalAccount: 'bank' | 'cash' | 'gold_purchase' | 'gold_sale' = 'bank';
    let finalPaymentMethod: 'cash' | 'card' | 'transfer' | undefined = paymentMethod;

    if (category === 'gold_buy') {
      finalAccount = 'gold_purchase';
      finalPaymentMethod = undefined;
    } else if (category === 'gold_sell') {
      finalAccount = 'gold_sale';
      finalPaymentMethod = undefined;
    } else if (category === 'transfer_to_bank') {
      finalAccount = 'bank';
      finalPaymentMethod = 'cash';
    } else if (category === 'transfer_to_cash') {
      finalAccount = 'cash';
      finalPaymentMethod = 'transfer';
    }

    onAddTransaction({
      date,
      type,
      amount: parsedAmount,
      category,
      description: description || (
        category === 'transfer_to_bank' ? 'تحويل من الكاش إلى حساب البنك' :
        category === 'transfer_to_cash' ? 'تحويل من حساب البنك إلى الكاش' :
        (type === 'expense' ? 'مصروف يومي' : 'دخل إضافي')
      ),
      account: finalAccount,
      goldGrams: grams,
      paymentMethod: finalPaymentMethod
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setGoldGrams('');
    setPaymentMethod('card');
    setErrorMsg('');
  };

  // Filtering transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const getCategoryDetails = (catId: string, transType: 'income' | 'expense') => {
    if (catId === 'transfer_to_bank') {
      return { name: 'تحويل إلى البنك 📥', color: 'bg-blue-100 text-blue-800' };
    }
    if (catId === 'transfer_to_cash') {
      return { name: 'تحويل إلى الكاش 📤', color: 'bg-teal-100 text-teal-800' };
    }
    const list = transType === 'expense' ? expenseCategoriesList : incomeCategoriesList;
    return list.find(c => c.id === catId) || { name: catId, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" dir="rtl">
      
      {/* Transaction Entry Form */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs h-fit space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">تسجيل معاملة مالية جديدة</h2>
          <p className="text-xs text-gray-400 mt-1">أضف مصاريفك اليومية أو مداخيلك لتحديث ميزانيتك تلقائياً</p>
        </div>

        {/* Toggle Income/Expense */}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              type === 'expense'
                ? 'bg-white text-rose-600 shadow-xs border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            مصروف (سحب)
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              type === 'income'
                ? 'bg-white text-emerald-600 shadow-xs border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            دخل (إيداع)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Amount In Euros */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">المبلغ باليورو (€)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-mono font-bold"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">EUR</span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-700">القسم / الفئة</label>
            </div>
            <select
              value={category}
              onChange={handleCategoryChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {type === 'expense'
                ? expenseCategoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                : incomeCategoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              }
            </select>

            <div className="mt-2 text-left">
              {!showAddCat ? (
                <button
                  type="button"
                  onClick={() => setShowAddCat(true)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100'
                      : 'text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {type === 'expense' ? '➕ إنشاء مصروف أو قسم مخصص جديد' : '➕ إنشاء مصدر دخل أو إيداع مخصص جديد'}
                </button>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2 mt-2">
                  <label className="block text-[10px] font-bold text-slate-500">
                    {type === 'expense' ? 'اسم المصروف أو القسم الجديد' : 'اسم مصدر الدخل الجديد'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder={type === 'expense' ? 'مثال: اشتراك نتفليكس، نادي رياضي...' : 'مثال: دخل يوتيوب، إيجار محل، عمولة...'}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCatName.trim() && onAddCustomCategory) {
                          onAddCustomCategory(newCatName.trim(), type);
                          setNewCatName('');
                          setShowAddCat(false);
                        }
                      }}
                      className={`font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer text-white ${
                        type === 'expense' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCat(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1.5 rounded-lg text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>

                  {/* Existing Custom Categories List */}
                  {((type === 'expense' ? customCategories : customIncomeCategories) || []).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-1.5 text-right">
                      <span className="block text-[10px] font-black text-slate-400">الفئات المخصصة الحالية (إعادة تسمية أو حذف):</span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {((type === 'expense' ? customCategories : customIncomeCategories) || []).map((cat) => {
                          const isEditing = editingCatId === cat.id;
                          return (
                            <div key={cat.id} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200/60 rounded-xl text-xs">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 w-full">
                                  <input
                                    type="text"
                                    value={editingCatName}
                                    onChange={(e) => setEditingCatName(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-sans"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingCatName.trim() && onEditCustomCategory) {
                                        onEditCustomCategory(cat.id, editingCatName.trim(), type);
                                        setEditingCatId(null);
                                      }
                                    }}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                    title="حفظ التعديل"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCatId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                                    title="إلغاء"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : deleteConfirmId === cat.id ? (
                                <div className="flex items-center justify-between w-full bg-rose-50/55 p-1 px-2 rounded-lg border border-rose-100 animate-fade-in">
                                  <span className="text-[10px] text-rose-700 font-bold">تأكيد حذف "{cat.name}"؟</span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onDeleteCustomCategory) {
                                          onDeleteCustomCategory(cat.id, type);
                                          if (category === cat.id) {
                                            setCategory(type === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id);
                                          }
                                        }
                                        setDeleteConfirmId(null);
                                      }}
                                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                    >
                                      حذف
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-all cursor-pointer"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${type === 'expense' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                                    <span className="font-bold text-slate-700">{cat.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCatId(cat.id);
                                        setEditingCatName(cat.name);
                                        setDeleteConfirmId(null);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                                      title="تعديل الاسم"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeleteConfirmId(cat.id);
                                        setEditingCatId(null);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                                      title="حذف الفئة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Gold Parameters (Conditional) */}
          {(category === 'gold_buy' || category === 'gold_sell') && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3"
            >
              <div className="flex items-center gap-2 text-xs text-amber-800 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>عملية خاصة بمخزون الذهب عيار 24</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">وزن الذهب بالجرام</label>
                <div className="relative">
                  <input
                    type="number"
                    value={goldGrams}
                    onChange={handleGoldGramsChange}
                    placeholder="0.000"
                    step="0.001"
                    required
                    className="w-full px-3 py-2 border border-amber-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-amber-700 font-medium">جرام</span>
                </div>
                <div className="text-[10px] text-amber-800 mt-1 font-sans">
                  * سعر الجرام الحالي: <span className="font-bold">€{gold.currentPricePerGram}</span>. يقوم النظام بمطابقة السعر آلياً.
                </div>
              </div>
            </motion.div>
          )}

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ المعاملة</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
          </div>

          {/* Notes/Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">ملاحظات / وصف المعاملة</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: شراء مقاضي البيت الأسبوعية"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Payment Method Selector (Conditional if not gold transaction) */}
          {category !== 'gold_buy' && category !== 'gold_sell' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">طريقة الدفع / المعاملة</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 rounded-xl border font-semibold text-xs transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  💳 بطاقة بنكية
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-xl border font-semibold text-xs transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  💵 نقدي
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-2 px-3 rounded-xl border font-semibold text-xs transition-all ${
                    paymentMethod === 'transfer'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🏦 تحويل بنكي
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-xs text-sm flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            حفظ المعاملة وتحديث الأرصدة
          </button>
        </form>
      </div>

      {/* Transactions History and Filters */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
        
        {/* Title and stats bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">سجل اليوميات المالي</h2>
            <p className="text-xs text-gray-400 mt-1">عرض ومتابعة المعاملات المدخلة ومراقبة تفاصيلها بدقة</p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-bold">
            عدد المعاملات: {filteredTransactions.length}
          </span>
        </div>

        {/* Filters Panel */}
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4">
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن معاملة أو قسم..."
              className="w-full pr-10 pl-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedType}
              onChange={(e: any) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            >
              <option value="all">كل الأنواع</option>
              <option value="income">المداخيل فقط</option>
              <option value="expense">المصاريف فقط</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            >
              <option value="all">كل الفئات والأقسام</option>
              <optgroup label="المصاريف">
                {expenseCategoriesList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="المداخيل">
                {INCOME_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* List of transactions */}
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs font-sans">لا توجد أي معاملات مسجلة مطابقة للفلاتر المحددة.</p>
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const catDetails = getCategoryDetails(t.category, t.type);
              
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-gray-50 hover:border-gray-100 rounded-2xl transition-all shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Icon indicating type */}
                    <div className={`p-2 rounded-xl shrink-0 ${
                      t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-gray-800 text-sm leading-tight">{t.description}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${catDetails.color}`}>
                          {catDetails.name}
                        </span>
                        {t.goldGrams && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                            ⚖️ {t.goldGrams} جرام
                          </span>
                        )}
                        {t.paymentMethod && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {t.paymentMethod === 'card' ? '💳 بطاقة' : t.paymentMethod === 'cash' ? '💵 نقدي' : '🏦 تحويل'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {t.date}
                        </span>
                        <span>•</span>
                        <span>الحساب: {t.account === 'bank' ? 'البنك' : t.account === 'cash' ? 'خزنة الكاش' : 'الذهب عيار 24'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount and Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-100">
                    <span className={`text-sm font-mono font-bold ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="text-gray-300 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all"
                      title="حذف المعاملة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
