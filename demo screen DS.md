```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Grid,
  LineChart,
  LogOut,
  Trash2,
  CreditCard,
  Calendar,
  Search,
  Plus,
  ChevronDown,
  ShoppingBag,
  Car,
  Home,
  Tv,
  HeartPulse,
  DollarSign,
  ArrowUpRight,
  Info
} from 'lucide-react';

// הגדרת קטגוריות ותתי קטגוריות מובנות לעולם הפיננסי
const categoriesData = [
  {
    id: 'food',
    name: 'מזון וסופר',
    icon: ShoppingBag,
    color: '#358383',
    subcategories: ['סופרמרקט', 'מכולת', 'מסעדות', 'מאפייה', 'ירקות ופירות']
  },
  {
    id: 'transport',
    name: 'תחבורה',
    icon: Car,
    color: '#D4AF37',
    subcategories: ['דלק', 'תחבורה ציבורית', 'מוסך וטיפולים', 'חניה', 'ביטוח רכב']
  },
  {
    id: 'home',
    name: 'חשבונות ובית',
    icon: Home,
    color: '#163351',
    subcategories: ['חשמל ומים', 'ארנונה', 'ועד בית', 'תיקונים', 'שכירות/משכנתא']
  },
  {
    id: 'leisure',
    name: 'פנאי ותקשורת',
    icon: Tv,
    color: '#2D6A4F',
    subcategories: ['אינטרנט וטלפון', 'טלוויזיה וסטרימינג', 'קניות ברשת', 'בילויים', 'חדר כושר']
  },
  {
    id: 'health',
    name: 'בריאות וכללי',
    icon: HeartPulse,
    color: '#E11D48',
    subcategories: ['קופת חולים', 'תרופות', 'ביטוח בריאות', 'הוצאה חד פעמית']
  }
];

interface ExpenseRow {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export default function ExpensesDashboard() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('מאי');
  
  // שורות הטבלה בדיוק כפי שמופיעות בתמונה
  const [rows, setRows] = useState<ExpenseRow[]>([
    { id: 1, description: '', category: 'חשמל ומים', amount: 0, date: '01/05/2026' },
    { id: 2, description: '', category: 'אינטרנט וטלפון', amount: 0, date: '01/05/2026' },
    { id: 3, description: '', category: 'מכולת', amount: 0, date: '01/05/2026' },
    { id: 4, description: '', category: 'דלק', amount: 0, date: '01/05/2026' },
    { id: 5, description: '', category: 'מסעדות', amount: 0, date: '01/05/2026' },
  ]);

  // מעקב אחר השורה הפעילה (כדי לדעת לאן להזין את הקטגוריה שנבחרה)
  const [focusedRowId, setFocusedRowId] = useState<number | null>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('home');

  const handleAddRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, { id: newId, description: '', category: 'בחר קטגוריה', amount: 0, date: '01/05/2026' }]);
    setFocusedRowId(newId);
  };

  const handleDeleteRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id));
    if (focusedRowId === id) {
      setFocusedRowId(null);
    }
  };

  const handleUpdateRow = (id: number, field: keyof ExpenseRow, value: any) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // פונקציית הזנה אוטומטית בעת בחירת תת-קטגוריה
  const handleSelectSubcategory = (subcategoryName: string) => {
    if (focusedRowId !== null) {
      handleUpdateRow(focusedRowId, 'category', subcategoryName);
      // מעבר אוטומטי עדין לשורה הבאה כדי להקל על הזנה רציפה
      const currentIndex = rows.findIndex(r => r.id === focusedRowId);
      if (currentIndex < rows.length - 1) {
        setFocusedRowId(rows[currentIndex + 1].id);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] font-sans text-[#163351]" dir="rtl">
      
      {}
      {/* Sidebar - משוחזר בדיוק מהתמונה */}
      <aside className="w-16 bg-white border-l border-slate-100 flex flex-col items-center py-6 justify-between shrink-0">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="w-10 h-10 bg-[#163351] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ג
          </div>
          
          {/* Menu Items */}
          <nav className="flex flex-col gap-6">
            <button className="p-2.5 text-slate-400 hover:text-[#163351] rounded-xl transition">
              <Grid size={22} />
            </button>
            <button className="p-2.5 text-[#358383] bg-teal-50 rounded-xl transition">
              <LineChart size={22} />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-[#163351] rounded-xl transition">
              <TrendingUp size={22} />
            </button>
          </nav>
        </div>

        {/* Logout Bottom */}
        <button className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl transition">
          <LogOut size={22} />
        </button>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {}
        {/* Header - משוחזר מהתמונה */}
        <header className="p-6 pb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-[#163351]">הוצאות</h1>
              <span className="text-emerald-500 text-2xl font-bold">↘</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              הזן הוצאות חודשיות ושנתיות. בתצוגה השנתית ניתן גם להוסיף הוצאות לפי חגים.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            <button
              onClick={() => setActiveTab('yearly')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'yearly' ? 'bg-[#358383] text-white' : 'text-slate-500 hover:text-[#163351]'}`}
            >
              שנתי
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'monthly' ? 'bg-[#358383] text-white' : 'text-slate-500 hover:text-[#163351]'}`}
            >
              חודשי
            </button>
          </div>
        </header>

        {/* Filters Row */}
        <section className="px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white border border-slate-200 px-8 py-2 rounded-xl text-sm font-semibold text-[#163351] focus:outline-none focus:border-[#358383] shadow-sm cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <ChevronDown size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white border border-slate-200 px-8 py-2 rounded-xl text-sm font-semibold text-[#163351] focus:outline-none focus:border-[#358383] shadow-sm cursor-pointer"
              >
                <option value="מאי">מאי</option>
                <option value="יוני">יוני</option>
                <option value="יולי">יולי</option>
              </select>
              <ChevronDown size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
              <Calendar size={18} />
            </div>
          </div>
        </section>

        {}
        {/* Main Workspace Split Layout */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Right Column: Expenses Input List - (75% width on large screens) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <h2 className="text-xl font-bold text-[#163351]">רשימת הוצאות</h2>
              </div>
              <button 
                onClick={handleAddRow}
                className="bg-[#358383] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#2b6d6d] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                הוסף שורה
              </button>
            </div>

            {/* Table Headers */}
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 px-4 mb-2">
              <div className="col-span-4 text-right">תיאור</div>
              <div className="col-span-3 text-right">קטגוריה</div>
              <div className="col-span-2 text-right">סכום (₪)</div>
              <div className="col-span-2 text-right">תאריך</div>
              <div className="col-span-1 text-center">פעולה</div>
            </div>

            {/* Expense Rows Container */}
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {rows.map((row) => (
                <div 
                  key={row.id} 
                  onClick={() => setFocusedRowId(row.id)}
                  className={`grid grid-cols-12 gap-4 items-center p-2 rounded-2xl transition-all cursor-pointer ${
                    focusedRowId === row.id 
                      ? 'bg-slate-50/80 border-2 border-[#358383]/30 shadow-sm' 
                      : 'border-2 border-transparent hover:bg-slate-50/50'
                  }`}
                >
                  {/* Description Input */}
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="לדוגמה: סופר"
                      value={row.description}
                      onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#163351] placeholder-slate-300 focus:outline-none focus:border-[#358383]"
                    />
                  </div>

                  {/* Category Search Input */}
                  <div className="col-span-3 relative">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-4 py-2.5 text-sm text-[#163351] focus:outline-none focus:border-[#358383] font-medium"
                    />
                    <Search size={14} className="absolute right-2.5 top-3.5 text-slate-400" />
                    <ChevronDown size={14} className="absolute left-2.5 top-3.5 text-slate-400" />
                  </div>

                  {/* Amount Input */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={row.amount === 0 ? '' : row.amount}
                      onChange={(e) => handleUpdateRow(row.id, 'amount', Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-left font-bold text-[#163351] placeholder-slate-300 focus:outline-none focus:border-[#358383]"
                    />
                  </div>

                  {/* Date Input with Icon */}
                  <div className="col-span-2 relative">
                    <input
                      type="text"
                      value={row.date}
                      onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-2 py-2.5 text-sm text-center text-[#163351] focus:outline-none focus:border-[#358383]"
                    />
                    <Calendar size={14} className="absolute right-2.5 top-3.5 text-slate-400" />
                  </div>

                  {/* Actions (Delete, Indicator, Card) */}
                  <div className="col-span-1 flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteRow(row.id); }}
                      className="text-slate-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <button className="text-slate-300 hover:text-[#358383] transition">
                      <CreditCard size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {}
          {/* Left Column: Category Helper Panel - (New added area) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#163351] flex items-center gap-2">
                <span className="text-base">✨</span>
                עוזר קטגוריות מהיר
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                בחר שורה מימין, ולחץ על קטגוריה ותת-קטגוריה כדי להזין במהירות.
              </p>
            </div>

            {/* Active Row Indicator */}
            {focusedRowId !== null ? (
              <div className="bg-[#358383]/5 border border-[#358383]/20 rounded-xl p-3 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#358383] animate-pulse" />
                  <span className="text-xs font-bold text-[#358383]">מזין כעת לשורה #{focusedRowId}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {rows.find(r => r.id === focusedRowId)?.description || 'ללא תיאור'}
                </span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center text-xs text-amber-600 font-medium">
                בחר שורה בטבלה כדי להתחיל להזין קטגוריות
              </div>
            )}

            {/* Category Selector Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {categoriesData.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl border text-right flex flex-col justify-between h-20 transition-all ${
                      isSelected 
                        ? 'bg-[#163351] border-transparent text-white shadow-md' 
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/60 text-[#163351]'
                    }`}
                  >
                    <div 
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-600 shadow-sm'
                      }`}
                      style={{ color: isSelected ? '#ffffff' : cat.color }}
                    >
                      <CatIcon size={16} />
                    </div>
                    <span className="text-xs font-bold mt-2">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Subcategories Container */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">תתי קטגוריות זמינות:</h4>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="wait">
                  {categoriesData
                    .find((cat) => cat.id === selectedCategory)
                    ?.subcategories.map((sub, idx) => (
                      <motion.button
                        key={`${selectedCategory}-${sub}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => handleSelectSubcategory(sub)}
                        disabled={focusedRowId === null}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          focusedRowId === null
                            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'bg-white hover:bg-[#358383] hover:text-white border-slate-200 text-slate-600 hover:border-transparent active:scale-95 shadow-sm'
                        }`}
                      >
                        {sub}
                      </motion.button>
                    ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Tip Footer inside selector */}
            <div className="mt-8 bg-[#F1F5F9]/60 p-3 rounded-xl flex items-start gap-2 border border-slate-200/40">
              <Info size={14} className="text-[#358383] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-normal">
                לחיצה על תת-קטגוריה מזינה אותה לשורה הנבחרת ועוברת אוטומטית לשורה הבאה להזנה מהירה.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
```