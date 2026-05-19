# גוטפלוס פיננסנט — Design System Summary

מערכת העיצוב נועדה להבטיח אחידות ויזואלית, קלילות ומקצועיות בכל חלקי המערכת הפיננסית, תוך שמירה על היררכיה ברורה וחוויית משתמש זורמת.

---

## 1. פלטת הצבעים (Color Palette)

### צבעי יסוד (Primary)
*   **כחול צי (Navy) — `#163351`:** משמש לטקסט ראשי, כותרות וכפתורים משניים. משדר סמכות וביטחון.
*   **טורקיז עמוק (Teal) — `#358383`:** משמש להנעה לפעולה (CTA), אלמנטים נבחרים ואייקונים מרכזיים. משדר צמיחה וחדשנות.

### צבעי רקע ומשטח (Background & Surfaces)
*   **לבן נקי (Pure White) — `#FFFFFF`:** רקע לכרטיסים, תיבות טקסט ומכולות מידע. יוצר את הקלילות והמרחב.
*   **אפור-תכלת בהיר (Soft Shade) — `#F1F5F9`:** רקע כללי של האפליקציה למניעת עייפות עיניים והפרדה עדינה של אלמנטים.

### צבעי דגש וחיווי (Accents & UI)
*   **זהב מאופק (Muted Gold) — `#D4AF37`:** דגשים קטנים, חיווי על סטטוס "פרימיום" או יעדים שהושגו.
*   **אפור פלדה (Steel Grey) — `#64748B`:** טקסט משני, תאריכים, הסברים וכותרות טבלה.
*   **ירוק הצלחה (Success Green) — `#2D6A4F`:** חיווי על רווחים, עליות בגרפים ואישורים.

---

## 2. טיפוגרפיה (Typography)

*   **כותרות ראשיות (H1/H2):** גופן עבה (`font-black` או `font-bold`), בצבע כחול נייבי.
*   **טקסט רץ (Body):** גופן קריא בגודל `base` או `sm`, בצבע כחול נייבי (עבור תוכן מרכזי) או אפור פלדה (עבור תיאורים).
*   **ריווח שורות:** שימוש תמידי ב-`leading-relaxed` כדי לאפשר "נשימה" לקורא בין מספרים ונתונים.

---

## 3. קומפוננטות ריאקט בסיסיות (React Components)

להלן מימוש של אבני הבניין המרכזיות במערכת באמצעות **React**, **Tailwind CSS** ו-**Framer Motion**.

### א. כפתור הנעה לפעולה (Primary Button)
כפתור הטורקיז המרכזי שמיועד להוביל את המשתמש לביצוע פעולות חשובות.

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, brightness: 1.1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#358383] text-white px-6 py-3 rounded-xl font-bold transition shadow-md shadow-[#358383]/10 hover:shadow-lg hover:shadow-[#358383]/20"
    >
      {children}
    </motion.button>
  );
};
```
### ב. Financial Stat Card
```tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  accentColor?: 'teal' | 'gold' | 'navy';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, accentColor = 'teal' }) => {
  const accentClasses = {
    teal: 'bg-[#358383]',
    gold: 'bg-[#D4AF37]',
    navy: 'bg-[#163351]',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
      
      <div className={`absolute top-0 right-0 w-1 h-full ${accentClasses[accentColor]}`} />
      
      <p className="text-[#64748B] text-sm mb-1 font-medium">{title}</p>
      <h3 className="text-3xl font-black text-[#163351]">{value}</h3>
      {subtext && <p className="text-xs mt-3 font-semibold text-[#358383]">{subtext}</p>}
    </div>
  );
};
```
### ג. Input Field
```tsx
import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full text-right" dir="rtl">
      <label className="text-sm font-bold text-[#163351]">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#F1F5F9]/50 text-[#163351] focus:outline-none focus:border-[#358383] focus:bg-white transition-all text-sm"
      />
    </div>
  );
};
```

### ד. עקרונות פריסה, ריווח ואנימציה (Layout & Animation Rules)

כדי לשמור על חוויית משתמש קלילה, מרווחת וזורמת במערכת פיננסית, אנו מגדירים שלושה כללי ברזל לפריסת הרכיבים (Layout) והאנימציות במערכת:

1.  **יחס השטח (חוק 70-20-10):** לפחות 70% מהמסך יהיה שטח לבן או אפור בהיר (`#F1F5F9`) המעניק "נשימה" לעיניים. 20% מיועדים למבנה וטקסט בכחול נייבי (`#163351`), ו-10% בלבד לצבעי דגש (טורקיז וזהב) עבור כפתורים ואינדיקטורים.
2.  **רדיוס פינות אחיד (Border Radius):** כל כרטיסי המידע, שדות הקלט והכפתורים ישתמשו בפינות מעוגלות מודרניות של `rounded-xl` (12px) או `rounded-2xl` (16px).
3.  **אנימציות מיקרו-אינטראקציה עדינות:** תנועות של רכיבים או מעברי מצב לא יעלו על 0.3 שניות, כדי לשמור על תחושת מערכת מהירה, חדה ותגובתית.

#### דוגמת קומפוננט: פריסת לוח בקרה מרווח (Dashboard Layout Component)

קומפוננטה זו מיישמת את עקרונות הפריסה, הריווח והאנימציה העדינה בכרטיסי נתונים:

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface DashboardGridProps {
  children: React.ReactNode;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ children }) => {
  // הגדרת האנימציה לפריסת הרכיבים בהדרגה (Stagger Effect)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // ריווח של 0.1 שניות בין כניסת כרטיס לכרטיס
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#F1F5F9] min-h-screen"
      dir="rtl"
    >
      
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants} className="h-full">
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
```
