import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  PieChart,
  Wallet,
  DollarSign,
} from 'lucide-react';

const quotes = [
  {
    title: "סדר בראש, סדר במקלדת",
    text: "ניהול תקציב חכם שמארגן לכם את ההכנסות, מסכם את ההוצאות בממשק נוח וזמין.",
    icon: Wallet,
  },
  {
    title: "ארבעת הצעדים לשלווה כלכלית",
    text: "לדעת, לפעול, לתכנן, להרוויח! המודל של גוטפלוס שהביא אלפי משפחות לשלווה אמיתית.",
    icon: DollarSign,
  },
  {
    title: "להפוך תקציב מאויב לאוהב",
    text: "אנו מאמינים שחיים עם תקציב הם מסודרים ושלווים יותר. מוזמנים לאהוב את המסגרת!",
    icon: PieChart,
  },
  {
    title: "הפלא השמיני בתבל: ריבית דריבית",
    text: "לבחור מסלול השקעות חכם ולתכנן היום את התשואה של מחר.",
    icon: TrendingUp
  },
];

export default function LoginVisualSide() {
  const [index, setIndex] = useState(0);

  // החלפת משפטים אוטומטית בכל 5 שניות
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const Icon = quotes[index].icon;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#163351]">
      
      {/* אלמנטים גרפיים נעים ברקע (צבע הטורקיז) */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#358383] blur-3xl"
      />
      <motion.div 
        animate={{ 
          x: [-20, 20, -20],
          y: [0, 50, 0],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-10 -left-10 w-[500px] h-[500px] rounded-full bg-[#358383] blur-[100px]"
      />

      {/* שכבת תוכן מרכזית */}
      <div className="relative z-10 w-full max-w-lg px-12 text-center text-white">
        
        {/* לוגו או כותרת עליונה */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-4xl font-black tracking-tight mb-2">גוטפלוס <span className="text-[#358383]">פיננסנט</span></h2>
          <div className="h-1 w-20 bg-[#358383] mx-auto rounded-full" />
        </motion.div>

        {/* משפטים מתחלפים עם AnimatePresence */}
        <div className="relative h-64">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center"
            >
              <div className="mb-6 p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
                <Icon size={48} className="text-[#358383]" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 leading-tight">
                {quotes[index].title}
              </h3>
              
              <p className="text-lg text-slate-300 leading-relaxed max-w-sm">
                {quotes[index].text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* אינדיקטורים בתחתית */}
        <div className="mt-12 flex gap-3 justify-center">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
              style={{ width: i === index ? '40px' : '12px' }}
            >
              <div className={`absolute inset-0 ${i === index ? 'bg-[#358383]' : 'bg-white/20'}`} />
              {i === index && (
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="absolute inset-0 bg-white/40"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* אלמנטים צפים קטנים (אייקונים דהויים ברקע) */}
      <FloatingIcons />
    </div>
  );
}

function FloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-20">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white"
          initial={{ 
            x: Math.random() * 800, 
            y: Math.random() * 800 
          }}
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ 
            duration: 5 + i, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          style={{ 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%` 
          }}
        >
          <DollarSign size={20 + i * 5} />
        </motion.div>
      ))}
    </div>
  );
}