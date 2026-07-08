import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  Eye, 
  Search, 
  ShieldAlert, 
  Edit, 
  Coins, 
  Wallet, 
  ArrowLeft,
  X,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppData, Transaction } from '../types';

interface AdminUser {
  id: number;
  email: string;
  bankBalance: string | number;
  goldGrams: string | number;
  goldPricePerGram: string | number;
  goalTarget: string | number;
  goalTitle: string;
  createdAt: string;
}

interface AdminPanelProps {
  adminEmail: string;
}

export default function AdminPanel({ adminEmail }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected User for View/Edit state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUserState, setSelectedUserState] = useState<AppData | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);

  // Form edit values for selected user
  const [editBankBalance, setEditBankBalance] = useState<number>(0);
  const [editGoldGrams, setEditGoldGrams] = useState<number>(0);
  const [editGoalTarget, setEditGoalTarget] = useState<number>(100000);
  const [editGoalTitle, setEditGoalTitle] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users?adminEmail=${encodeURIComponent(adminEmail)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'فشل تحميل الأعضاء.');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء جلب البيانات.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (userId === 1 || userEmail === 'admin@hassala.com') {
      alert('لا يمكن حذف حساب المدير الافتراضي.');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف العضو "${userEmail}" وجميع سجلاته المالية نهائياً؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/user/${userId}?adminEmail=${encodeURIComponent(adminEmail)}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'فشل حذف العضو.');
      }
      setSuccessMessage('تم حذف العضو وسجلاته المالية بالكامل بنجاح!');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setSelectedUserState(null);
      }
    } catch (err: any) {
      setError(err.message || 'فشل حذف الحساب.');
    }
  };

  const handleSelectUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setIsLoadingState(true);
    setSelectedUserState(null);
    try {
      const response = await fetch(`/api/admin/user/${user.id}/state?adminEmail=${encodeURIComponent(adminEmail)}`);
      if (!response.ok) {
        throw new Error('فشل تحميل السجل المالي التفصيلي.');
      }
      const data = await response.json();
      setSelectedUserState(data.state);
      
      // Seed form values
      setEditBankBalance(Number(user.bankBalance) || 0);
      setEditGoldGrams(Number(user.goldGrams) || 0);
      setEditGoalTarget(Number(user.goalTarget) || 100000);
      setEditGoalTitle(user.goalTitle || 'توفير مئة ألف يورو');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleSaveUserState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedUserState) return;

    setIsSavingUser(true);
    try {
      // Prepare updated AppData state
      const updatedState: AppData = {
        ...selectedUserState,
        bankBalance: editBankBalance,
        gold: {
          ...selectedUserState.gold,
          grams: editGoldGrams
        },
        goal: {
          target: editGoalTarget,
          title: editGoalTitle
        }
      };

      const response = await fetch(`/api/admin/user/${selectedUser.id}/update-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          state: updatedState
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'فشل تحديث البيانات.');
      }

      setSuccessMessage('تم تعديل وحفظ السجل المالي للعضو بنجاح! ☁️');
      setTimeout(() => setSuccessMessage(null), 3500);
      
      // Update local users table view
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? {
        ...u,
        bankBalance: editBankBalance,
        goldGrams: editGoldGrams,
        goalTarget: editGoalTarget,
        goalTitle: editGoalTitle
      } : u));

      setSelectedUser(null);
      setSelectedUserState(null);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Admin Heading */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white font-sans">لوحة تحكم المدير العام للمنصة</h2>
          </div>
          <p className="text-xs text-slate-400">إدارة العضويات، ومراجعة حسابات الذهب والأرصدة البنكية وتعديل البيانات المالية للأعضاء المسجلين.</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs text-amber-400 font-mono">
          البريد النشط: {adminEmail}
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout: Split view if a user is selected for detailed editing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Users List Card */}
        <div className={`${selectedUser ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>جميع الأعضاء المسجلين</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {filteredUsers.length} عضو
              </span>
            </h3>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="ابحث عن عضو بالإيميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-sans text-slate-800"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              جاري جلب قائمة الأعضاء من قاعدة البيانات السحابية...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              لا توجد حسابات مسجلة تطابق بحثك حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="py-3 px-2 font-bold text-[10px] uppercase">معرف الحساب</th>
                    <th className="py-3 px-2 font-bold text-[10px] uppercase">البريد الإلكتروني</th>
                    <th className="py-3 px-2 font-bold text-[10px] uppercase text-left">رصيد البنك</th>
                    <th className="py-3 px-2 font-bold text-[10px] uppercase text-left">ذهب عيار 24</th>
                    <th className="py-3 px-2 font-bold text-[10px] uppercase text-center">تاريخ التسجيل</th>
                    <th className="py-3 px-2 font-bold text-[10px] uppercase text-center">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(user => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${selectedUser?.id === user.id ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="py-3.5 px-2 font-mono font-bold text-slate-400 text-[11px]">#{user.id}</td>
                      <td className="py-3.5 px-2">
                        <span className="font-bold text-slate-800 break-all">{user.email}</span>
                        {user.id === 1 && (
                          <span className="mr-1.5 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">المدير الافتراضي</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-left font-mono font-bold text-slate-900">
                        €{Number(user.bankBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-2 text-left font-mono font-bold text-amber-600">
                        {Number(user.goldGrams).toFixed(3)} جرام
                      </td>
                      <td className="py-3.5 px-2 text-center text-[10px] text-slate-400 font-mono">
                        {new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSelectUser(user)}
                            title="عرض الحساب المالي والتعديل عليه"
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          {user.id !== 1 && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              title="حذف هذا العضو بالكامل"
                              className="p-1.5 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected User Details Drawer / Editor Panel */}
        {selectedUser && (
          <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="text-right">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">مراجعة وتعديل بيانات العضو</span>
                <h4 className="text-xs font-bold text-slate-300 font-sans break-all mt-0.5">{selectedUser.email}</h4>
              </div>
              <button 
                onClick={() => { setSelectedUser(null); setSelectedUserState(null); }}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingState ? (
              <div className="py-12 text-center text-xs text-slate-500">
                جاري تحميل المحفظة المالية وسجل العمليات بالكامل...
              </div>
            ) : (
              <form onSubmit={handleSaveUserState} className="space-y-5">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h5 className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Edit className="w-3.5 h-3.5" />
                    تعديل الأرصدة والمخزون الحالي
                  </h5>

                  {/* Bank Balance Field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">الرصيد البنكي (€)</label>
                    <div className="relative">
                      <Wallet className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                      <input 
                        type="number"
                        step="0.01"
                        value={editBankBalance}
                        onChange={(e) => setEditBankBalance(Number(e.target.value))}
                        className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono font-bold text-white text-left"
                      />
                    </div>
                  </div>

                  {/* Gold Grams Field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">مخزون الذهب عيار 24 (جرام)</label>
                    <div className="relative">
                      <Coins className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                      <input 
                        type="number"
                        step="0.001"
                        value={editGoldGrams}
                        onChange={(e) => setEditGoldGrams(Number(e.target.value))}
                        className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono font-bold text-white text-left"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h5 className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    تحديث هدف الادخار الشخصي للعضو
                  </h5>

                  {/* Goal Title */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">عنوان الهدف</label>
                    <input 
                      type="text"
                      value={editGoalTitle}
                      onChange={(e) => setEditGoalTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-sans font-medium text-white text-right"
                    />
                  </div>

                  {/* Goal Target */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">مبلغ الهدف الإجمالي (€)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={editGoalTarget}
                      onChange={(e) => setEditGoalTarget(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono font-bold text-white text-left"
                    />
                  </div>
                </div>

                {/* Users Transactions Review */}
                {selectedUserState && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <h5 className="text-[10px] font-bold text-slate-400">آخر العمليات المالية المسجلة للعضو ({selectedUserState.transactions?.length || 0})</h5>
                    {(!selectedUserState.transactions || selectedUserState.transactions.length === 0) ? (
                      <p className="text-[10px] text-slate-500 text-center py-4 bg-slate-900 rounded-xl border border-slate-800/50">العضو لم يسجل أي عمليات مالية بعد.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedUserState.transactions.slice(0, 5).map((tx: Transaction) => (
                          <div key={tx.id} className="p-2 bg-slate-900 border border-slate-800/60 rounded-xl flex items-center justify-between text-[11px]">
                            <div className="text-right">
                              <p className="font-bold text-slate-300 text-[10px]">{tx.description || tx.category}</p>
                              <span className="text-[8px] text-slate-500 font-mono">{tx.date} • {tx.account === 'bank' ? 'البنك' : 'شراء الذهب'}</span>
                            </div>
                            <span className={`font-mono font-bold text-[10px] ${tx.type === 'income' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {tx.type === 'income' ? '+' : '-'}€{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingUser ? 'جاري حفظ وتعديل بيانات العضو...' : 'حفظ التعديلات وتحديث محفظة العضو'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
