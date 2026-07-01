import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Coins, 
  ArrowRight, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Minus,
  Info,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { Transaction, GoldState } from '../types';

interface GoldTrackerProps {
  gold: GoldState;
  transactions: Transaction[];
  updateGoldPrice: (price: number) => void;
  updateGoldGrams: (grams: number) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export default function GoldTracker({
  gold,
  transactions,
  updateGoldPrice,
  updateGoldGrams,
  onAddTransaction
}: GoldTrackerProps) {
  // Calculators State
  const [calcGrams, setCalcGrams] = useState('');
  const [calcEuros, setCalcEuros] = useState('');
  const [inputPrice, setInputPrice] = useState(gold.currentPricePerGram.toString());
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isEditingGrams, setIsEditingGrams] = useState(false);
  const [tempGrams, setTempGrams] = useState(gold.grams.toString());

  const handleSaveGrams = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempGrams);
    if (!isNaN(parsed) && parsed >= 0) {
      updateGoldGrams(parsed);
      setIsEditingGrams(false);
    }
  };

  // Extract all gold-related transactions
  const goldTransactions = transactions.filter(
    t => t.category === 'gold_buy' || t.category === 'gold_sell'
  );

  const totalGoldValue = gold.grams * gold.currentPricePerGram;

  // Handle calculator: Grams to Euros
  const handleGramsChange = (val: string) => {
    setCalcGrams(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setCalcEuros((parsed * gold.currentPricePerGram).toFixed(2));
    } else {
      setCalcEuros('');
    }
  };

  // Handle calculator: Euros to Grams
  const handleEurosChange = (val: string) => {
    setCalcEuros(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0 && gold.currentPricePerGram > 0) {
      setCalcGrams((parsed / gold.currentPricePerGram).toFixed(3));
    } else {
      setCalcGrams('');
    }
  };

  const handlePriceUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputPrice);
    if (!isNaN(parsed) && parsed > 0) {
      updateGoldPrice(parsed);
      setIsUpdatingPrice(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">محفظة الذهب عيار 24 قيراط</h2>
          <p className="text-sm text-gray-500 mt-1 font-sans">تتبع مخزونك الاستثماري من الذهب النقي عيار 24 واحسب قيمته المحدثة باليورو بدقة بالغة</p>
        </div>
        <div className="flex items-center gap-2">
          {isUpdatingPrice ? (
            <form onSubmit={handlePriceUpdateSubmit} className="flex items-center gap-2 bg-white p-1 rounded-xl border border-amber-300">
              <input
                type="number"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                className="w-24 px-2 py-1 text-sm font-mono border-0 focus:ring-0 text-center"
                step="0.01"
              />
              <button type="submit" className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700">تحديث</button>
              <button type="button" onClick={() => setIsUpdatingPrice(false)} className="text-xs text-gray-400 px-1 hover:text-gray-600">إلغاء</button>
            </form>
          ) : (
            <button
              onClick={() => { setInputPrice(gold.currentPricePerGram.toString()); setIsUpdatingPrice(true); }}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              تحديث سعر جرام الذهب اليوم
            </button>
          )}
        </div>
      </div>

      {/* Gold Asset Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Weight */}
        <div className="bg-amber-50/40 p-6 rounded-3xl border border-amber-100 flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <span className="text-xs text-amber-800 font-bold block">إجمالي وزن الذهب عيار 24</span>
            {isEditingGrams ? (
              <form onSubmit={handleSaveGrams} className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={tempGrams}
                  onChange={(e) => setTempGrams(e.target.value)}
                  className="w-24 px-2.5 py-1 text-sm font-mono border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  step="0.001"
                />
                <button type="submit" className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700">حفظ</button>
                <button type="button" onClick={() => setIsEditingGrams(false)} className="text-xs text-gray-500 px-1 hover:text-gray-700">إلغاء</button>
              </form>
            ) : (
              <div className="flex items-baseline gap-2 mt-2">
                <div className="text-3xl font-mono font-bold text-amber-900">
                  {gold.grams.toLocaleString()}{' '}
                  <span className="text-sm font-sans font-normal text-amber-700">جرام</span>
                </div>
                <button
                  onClick={() => { setTempGrams(gold.grams.toString()); setIsEditingGrams(true); }}
                  className="text-xs text-amber-700 hover:underline hover:text-amber-900"
                >
                  تعديل مباشر
                </button>
              </div>
            )}
          </div>
          <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-amber-600 text-white p-6 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-amber-100 font-medium">القيمة السوقية الإجمالية باليورو</span>
            <div className="text-3xl font-mono font-bold">€{totalGoldValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Current Market Price per Gram */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium">سعر جرام الذهب عيار 24 (اليوم)</span>
            <div className="text-2xl font-mono font-bold text-gray-900">€{gold.currentPricePerGram.toLocaleString()} / جرام</div>
          </div>
          <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
        </div>

      </div>

      {/* Two-Way Instant Gold Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Interactive Converter */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">حاسبة الذهب السريعة عيار 24</h3>
            <p className="text-xs text-gray-400 mt-1">حوّل بين الوزن بالجرامات والقيمة باليورو في ثوانٍ معدودة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Input Grams */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600">الوزن بالجرامات</label>
              <div className="relative">
                <input
                  type="number"
                  value={calcGrams}
                  onChange={(e) => handleGramsChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-base font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">جرام</span>
              </div>
            </div>

            {/* Input EUR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600">القيمة باليورو (€)</label>
              <div className="relative">
                <input
                  type="number"
                  value={calcEuros}
                  onChange={(e) => handleEurosChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-base font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">EUR</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-sans">
              يتم الحساب تلقائياً اعتماداً على سعر الجرام الحالي لعيار 24 (<span className="font-bold font-mono">€{gold.currentPricePerGram}</span>/جرام). يمكنك مواءمة الوزن والقيمة قبل التوجه للشراء أو البيع الفعلي.
            </div>
          </div>
        </div>

        {/* Why Invest in Gold Panel */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">ملاذ آمن لمدخراتك الماليّة</h3>
            <p className="text-xs text-gray-400 mt-1">لماذا يوصى بامتلاك الذهب عيار 24 كجزء من أصولك؟</p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex gap-3 text-xs">
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg font-bold h-fit shrink-0">1</span>
              <div>
                <span className="font-bold text-gray-800">الحماية التامة من التضخم:</span>
                <p className="text-gray-500 font-sans mt-0.5">العملات الورقية قد تفقد جزءاً من قوتها الشرائية بمرور السنين، بينما يحتفظ الذهب بقيمته الذاتية الحقيقية.</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg font-bold h-fit shrink-0">2</span>
              <div>
                <span className="font-bold text-gray-800">سهولة التسييل:</span>
                <p className="text-gray-500 font-sans mt-0.5">الذهب عيار 24 هو المعيار الدولي الأكثر رواجاً، ويمكنك بيعه فوراً في أي دولة بالعالم وبالسعر السائد في السوق.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-50 pt-4 flex justify-between items-center text-xs text-amber-800 font-medium">
            <span>مجموع جرامات الذهب المسجلة لديك:</span>
            <span className="font-mono font-bold text-base text-amber-600">{gold.grams} جرام</span>
          </div>
        </div>

      </div>

      {/* Gold Transactions History */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">تاريخ معاملات الذهب الاستثمارية</h3>
          <p className="text-xs text-gray-400 mt-1">سجل تفصيلي لكافة عمليات الشراء والبيع والادخار للذهب عيار 24</p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {goldTransactions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-100 rounded-2xl text-gray-400 text-xs font-sans">
              لم تقم بتسجيل أي معاملة ذهب (شراء أو بيع) حتى الآن. يمكنك إضافة معاملة جديدة وتعيين قسم "شراء ذهب" أو "بيع ذهب".
            </div>
          ) : (
            goldTransactions.map((t, idx) => (
              <div 
                key={t.id || idx}
                className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    t.category === 'gold_buy' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-sm">{t.description}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        t.category === 'gold_buy' ? 'bg-amber-500/10 text-amber-800' : 'bg-emerald-500/10 text-emerald-800'
                      }`}>
                        {t.category === 'gold_buy' ? 'شراء ذهب' : 'بيع ذهب'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 font-sans">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {t.date}
                      </span>
                      <span>•</span>
                      <span>الوزن: {t.goldGrams} جرام عيار 24</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 font-mono">
                  <span className={`text-sm font-bold ${
                    t.category === 'gold_buy' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {t.category === 'gold_buy' ? '-' : '+'}€{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-amber-700 font-sans font-medium">
                    (سعر الجرام الافتراضي: €{(t.amount / (t.goldGrams || 1)).toFixed(2)})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
