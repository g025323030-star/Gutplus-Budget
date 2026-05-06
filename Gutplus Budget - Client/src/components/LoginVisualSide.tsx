import { motion } from 'framer-motion';
import {
  TrendingUp,
  PieChart,
  Target,
  Wallet,
  DollarSign,
  PiggyBank,
} from 'lucide-react';

/**
 * LoginVisualSide Component
 * Displays rotating financial quotes with minimalist icons
 */
export default function LoginVisualSide() {
  const quotes = [
    {
      text: "תקציב הוא הנחיית כספך לאן שהוא צריך ללכת, במקום להתהפך איפה הוא הלך.",
      icon: Wallet,
    },
    {
      text: "ההשקעה הטובה ביותר היא בעצמך ובביטחון הכספי של משפחתך.",
      icon: PiggyBank,
    },
    {
      text: "שלום כספי מושג כאשר יש לך תוכנית מוצקה.",
      icon: Target,
    },
    {
      text: "כל דולר שחוסכים היום הוא דולר שמרוויח לעתידך.",
      icon: DollarSign,
    },
    {
      text: "תקציב חכם הופך חלומות למטרות השגות.",
      icon: TrendingUp,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center p-12 bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center mb-16 space-y-4" variants={itemVariants}>
        <h2 className="heading-1 text-primary">GutPlus Budget</h2>
        <p className="body-text max-w-md">
          השתלוט על כספי המשפחה שלך עם תקציב חכם
        </p>
      </motion.div>

      {/* Rotating Quotes Section */}
      <motion.div className="relative w-full h-64 flex items-center justify-center">
        {quotes.map((quote, index) => {
          const Icon = quote.icon;
          return (
            <motion.div
              key={index}
              className="absolute w-full flex flex-col items-center justify-center space-y-6 px-8"
              initial={{ opacity: 0 }}
              animate={{
                opacity: index === 0 ? 1 : 0,
              }}
              transition={{
                duration: 0.8,
                ease: 'easeInOut',
              }}
            >
              <div className="flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 2,
                    ease: 'easeInOut',
                    repeat: Infinity,
                  }}
                >
                  <Icon
                    size={48}
                    className="text-accent stroke-[1.5]"
                    strokeWidth={1.5}
                  />
                </motion.div>
              </div>
              <p className="text-center text-primary font-medium text-lg leading-relaxed">
                "{quote.text}"
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quote Indicators */}
      <motion.div
        className="mt-12 flex gap-2 justify-center"
        variants={itemVariants}
      >
        {quotes.map((_, index) => (
          <motion.div
            key={index}
            className="h-2 bg-slate-300 rounded-full cursor-pointer transition-all"
            animate={{
              width: index === 0 ? 32 : 8,
              backgroundColor: index === 0 ? '#358383' : '#cbd5e1',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </motion.div>

      {/* Financial Icons Grid */}
      <motion.div
        className="mt-16 grid grid-cols-3 gap-6"
        variants={itemVariants}
      >
        <motion.div
          className="flex flex-col items-center gap-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Wallet className="text-accent" strokeWidth={1.5} size={24} />
          </div>
          <span className="text-xs text-slate-600">ניטור</span>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <PieChart className="text-accent" strokeWidth={1.5} size={24} />
          </div>
          <span className="text-xs text-slate-600">ניתוח</span>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <TrendingUp className="text-accent" strokeWidth={1.5} size={24} />
          </div>
          <span className="text-xs text-slate-600">תכנון</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
