import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Loader2 } from 'lucide-react';
import { createHousehold } from '../../services/households.service';
import { useAuth } from '../../context/AuthContext';

interface HouseholdStepProps {
  onComplete: () => void;
}

export default function HouseholdStep({ onComplete }: HouseholdStepProps) {
  const { refreshUserStatus } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('נא להזין שם למשק הבית');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await createHousehold({ name: trimmed });
      await refreshUserStatus();
      onComplete();
    } catch (err) {
      console.error(err);
      setError('שמירה נכשלה. נסו שוב בעוד רגע');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.form
      key="step-1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="flex flex-col items-center text-center"
      dir="rtl"
    >
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <Home className="w-10 h-10 text-accent" strokeWidth={1.5} />
      </div>

      <h1 className="heading-1 mb-3">נעים להכיר — בואו נכיר את הבית שלכם</h1>
      <p className="body-text mb-8 max-w-md">
        איך תרצו לקרוא למשק הבית במערכת. השם הזה ילווה אתכם בכל המקומות
      </p>

      <div className="w-full max-w-md text-right">
        <label className="text-sm font-bold text-primary block mb-2">
          שם משק הבית
        </label>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={e => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="למשל: משפחת כהן"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all"
          maxLength={255}
          disabled={isSaving}
        />
        {error && (
          <p className="text-red-500 text-sm mt-2 text-right">{error}</p>
        )}
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: isSaving ? 1 : 1.02 }}
        whileTap={{ scale: isSaving ? 1 : 0.98 }}
        disabled={isSaving}
        className="bg-accent text-white px-8 py-3 rounded-xl font-bold mt-8 shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20 transition-all flex items-center gap-2 disabled:opacity-60"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>שומר</span>
          </>
        ) : (
          <>
            <span>המשך</span>
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
