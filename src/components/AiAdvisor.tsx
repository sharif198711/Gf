import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Coins, 
  LineChart, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  PiggyBank
} from 'lucide-react';
import { AppData, Transaction } from '../types';

interface AiAdvisorProps {
  appData: AppData;
}

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export default function AiAdvisor({ appData }: AiAdvisorProps) {
  // Analysis States
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string>('');

  // Chat States
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([
    {
      role: 'model',
      text: 'مرحباً بك! أنا "حصّالة الذكية" مستشارك المالي الخاص المدعوم بالذكاء الاصطناعي من جوجل. أنا ملم بوضعك المالي ومستعد لمساعدتك في التخطيط لموازنتك، أو تقديم نصائح حول شراء الذهب عيار 24، أو تحليل مصاريفك وكيفية تقليصها للوصول سريعاً لهدف الـ 100 ألف يورو. كيف يمكنني مساعدتك اليوم؟'
    }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSending]);

  // Request comprehensive analysis
  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: appData.transactions,
          gold: appData.gold,
          bankBalance: appData.bankBalance,
          goal: appData.goal
        }),
      });

      if (!response.ok) {
        throw new Error('فشل جلب تحليل الذكاء الاصطناعي من الخادم.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'حدث خطأ غير متوقع أثناء تحليل الميزانية.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send message to financial advisor chatbot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsSending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory.slice(1), // Exclude introductory greeting
          financialData: {
            bankBalance: appData.bankBalance,
            gold: appData.gold,
            goal: appData.goal
          }
        }),
      });

      if (!response.ok) {
        throw new Error('فشل الخادم في الرد على رسالتك.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setChatHistory(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: 'عذراً، واجهت مشكلة في الاتصال بالخادم الذكي. يرجى التحقق من إعداد مفتاح API الخاص بك والمحاولة لاحقاً.' 
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Elegant helper function to render Markdown to beautiful HTML simply and safely
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Split text into lines and parse basic structures (lists, titles, bold text, linebreaks)
    const lines = text.split('\n');
    return (
      <div className="space-y-3 text-right text-slate-700 leading-relaxed font-sans text-sm">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Header levels
          if (trimmed.startsWith('### ')) {
            return <h4 key={idx} className="text-sm font-black text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">{trimmed.substring(4)}</h4>;
          }
          if (trimmed.startsWith('## ')) {
            return <h3 key={idx} className="text-base font-extrabold text-slate-950 mt-5 mb-2 flex items-center gap-2 text-indigo-900">{trimmed.substring(3)}</h3>;
          }
          if (trimmed.startsWith('# ')) {
            return <h2 key={idx} className="text-lg font-black text-slate-950 mt-6 mb-3 text-indigo-950">{trimmed.substring(2)}</h2>;
          }

          // Lists/Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const rawContent = trimmed.substring(2);
            return (
              <ul key={idx} className="list-disc list-inside mr-4 text-xs text-slate-600 space-y-1">
                <li>{parseBoldAndRegular(rawContent)}</li>
              </ul>
            );
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const rawContent = trimmed.replace(/^\d+\.\s/, '');
            return (
              <ol key={idx} className="list-decimal list-inside mr-4 text-xs text-slate-600 space-y-1">
                <li>{parseBoldAndRegular(rawContent)}</li>
              </ol>
            );
          }

          // Empty line
          if (trimmed === '') {
            return <div key={idx} className="h-1.5" />;
          }

          // Regular paragraph
          return <p key={idx} className="text-xs leading-relaxed text-slate-600">{parseBoldAndRegular(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Safe basic formatter for bold (**text**)
  const parseBoldAndRegular = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, index) => {
      // Odd indices are bold text
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-slate-900 bg-amber-500/5 px-1 rounded">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            المستشار المالي الذكي (Gemini AI)
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            تحليل متكامل لمدخراتك وميزانيتك ومحفظتك من الذهب، مدعوماً بذكاء صناعي رائد.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive AI Financial Advisor & Analysis Generator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 text-right">تحليل الميزانية وتوليد التوصيات</h3>
                  <p className="text-[11px] text-slate-400 font-sans text-right">دراسة مصاريفك ونمو ثروتك وصياغة استراتيجية مخصصة للهدف</p>
                </div>
              </div>
              <button
                onClick={handleGenerateAnalysis}
                disabled={isAnalyzing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحليل...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>توليد تحليل ذكي جديد</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis text area */}
            <div className="bg-[#FAF9FB] border border-slate-100 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-800">جاري قراءة المعاملات ومطابقة أرصدة الذهب والسيولة...</p>
                    <p className="text-[10px] text-slate-400 font-sans">يقوم الذكاء الاصطناعي الآن بصياغة توصيات استثمارية مخصصة</p>
                  </div>
                </div>
              ) : analysisError ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                  <div className="text-xs text-rose-700 font-bold max-w-md leading-relaxed">{analysisError}</div>
                  <p className="text-[10px] text-slate-400 font-sans">تأكد من تكوين مفتاح Gemini API في الإعدادات الخاصة بـ AI Studio.</p>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تقرير التحليل والاستراتيجية</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {renderMarkdown(analysis)}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-700">لا يوجد تحليل مالي متوفر حالياً</div>
                  <p className="text-[10px] text-slate-400 font-sans max-w-sm leading-relaxed">
                    انقر فوق زر "توليد تحليل ذكي جديد" بالأعلى ليرسل النظام بيانات ميزانيتك ومعاملاتك ويولد لك خطة مخصصة.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chat Bot Panel */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 flex flex-col h-[525px] justify-between shadow-xl">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1">
                  مستشارك المساعد (الحصّالة الذكية)
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-[9px] text-slate-400 font-sans">اسألني أي سؤال عن الادخار، موازنة مصاريفك، أو الذهب عيار 24</p>
              </div>
            </div>

            {/* Chat bubbles container */}
            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 scrollbar-thin">
              {chatHistory.map((turn, index) => (
                <div 
                  key={index}
                  className={`flex ${turn.role === 'user' ? 'justify-start' : 'justify-end'} gap-2.5`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-800'
                  }`}>
                    {/* Render message formatting simply */}
                    {turn.text.split('\n').map((para, pIdx) => (
                      <p key={pIdx} className={pIdx > 0 ? 'mt-1.5' : ''}>{para}</p>
                    ))}
                  </div>
                  
                  {/* Avatar indicate */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    turn.role === 'user' ? 'bg-indigo-800 text-indigo-200' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {turn.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-end gap-2.5">
                  <div className="bg-slate-800 text-slate-300 rounded-2xl rounded-tl-none p-3.5 border border-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-800 pt-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="اكتب سؤالك الاستثماري هنا..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isSending}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 p-2.5 rounded-xl transition-all font-bold shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
