export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  account: 'bank' | 'cash' | 'gold_purchase' | 'gold_sale';
  goldGrams?: number; // If buying/selling gold, track grams
  paymentMethod?: 'cash' | 'card' | 'transfer';
}

export interface GoldState {
  grams: number;
  currentPricePerGram: number; // in EUR
}

export interface SavingsGoal {
  target: number; // default 100000
  title: string;
}

export interface AppData {
  transactions: Transaction[];
  gold: GoldState;
  bankBalance: number; // current bank balance
  cashBalance: number; // current cash balance
  goal: SavingsGoal;
  premiumTier?: 'free' | 'monthly' | 'lifetime';
  subscriptionActive?: boolean;
  paymentHistory?: { date: string; amount: number; type: 'monthly' | 'lifetime'; transactionId: string }[];
  categoryBudgets?: { [categoryKey: string]: number };
  customExpenseCategories?: { id: string; name: string; color: string }[];
  customIncomeCategories?: { id: string; name: string; color: string }[];
}
