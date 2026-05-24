import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { FamilyMemberRole } from '@gutplus/shared';
import { createFamilyMember } from '../../services/family-members.service';
import { useAuth } from '../../context/AuthContext';

interface FamilyMembersStepProps {
  initialNameSuggestion: string;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

interface DraftMember {
  localId: string;
  name: string;
  role: FamilyMemberRole;
}

const makeId = () => Math.random().toString(36).slice(2, 10);

const emptyRow = (
  name = '',
  role: FamilyMemberRole = FamilyMemberRole.Parent,
): DraftMember => ({ localId: makeId(), name, role });

export default function FamilyMembersStep({
  initialNameSuggestion,
  onComplete,
  onSkip,
  onBack,
}: FamilyMembersStepProps) {
  const { householdId } = useAuth();
  const [rows, setRows] = useState<DraftMember[]>(() => [
    emptyRow(initialNameSuggestion, FamilyMemberRole.Parent),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateRow = (localId: string, patch: Partial<DraftMember>) => {
    setRows(prev =>
      prev.map(row => (row.localId === localId ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow('', FamilyMemberRole.Child)]);
  };

  const removeRow = (localId: string) => {
    setRows(prev => prev.filter(row => row.localId !== localId));
  };

  const handleSubmit = async () => {
    if (!householdId) {
      setError('משק הבית עוד לא נשמר. רעננו את הדף ונסו שוב');
      return;
    }
    const filled = rows.filter(row => row.name.trim().length > 0);
    if (filled.length === 0) {
      onSkip();
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await Promise.all(
        filled.map(row =>
          createFamilyMember({
            name: row.name.trim(),
            role: row.role,
            householdId,
          }),
        ),
      );
      onComplete();
    } catch (err) {
      console.error(err);
      setError('חלק מבני המשפחה לא נשמרו. נסו שוב');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center w-full"
      dir="rtl"
    >
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-accent" strokeWidth={1.5} />
      </div>

      <h1 className="heading-1 mb-3">מי גר אצלכם בבית</h1>
      <p className="body-text mb-8 max-w-md">
        ספרו לנו על בני המשפחה. תוכלו תמיד לערוך, להוסיף או למחוק מאוחר יותר
      </p>

      <div className="w-full max-w-xl space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.localId}
            className="bg-background/40 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <input
              type="text"
              value={row.name}
              onChange={e => updateRow(row.localId, { name: e.target.value })}
              placeholder={
                index === 0 ? 'שם פרטי (לדוגמה: דנה)' : 'שם בן המשפחה'
              }
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-primary focus:outline-none focus:border-accent transition-all text-right"
              maxLength={255}
              disabled={isSaving}
            />
            <div className="flex gap-2">
              <RoleChip
                active={row.role === FamilyMemberRole.Parent}
                onClick={() =>
                  updateRow(row.localId, { role: FamilyMemberRole.Parent })
                }
                disabled={isSaving}
              >
                הורה
              </RoleChip>
              <RoleChip
                active={row.role === FamilyMemberRole.Child}
                onClick={() =>
                  updateRow(row.localId, { role: FamilyMemberRole.Child })
                }
                disabled={isSaving}
              >
                ילד
              </RoleChip>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.localId)}
                  disabled={isSaving}
                  aria-label="הסר בן משפחה"
                  className="w-10 h-10 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 transition-all flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          disabled={isSaving}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={1.5} />
          <span>הוספת בן משפחה</span>
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-600 font-bold hover:border-slate-400 transition-all"
        >
          חזור
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSaving}
          className="flex-1 px-6 py-3 rounded-xl border-2 border-accent text-accent font-bold hover:bg-accent/5 transition-all"
        >
          דלג בינתיים
        </button>
        <motion.button
          type="button"
          whileHover={{ scale: isSaving ? 1 : 1.02 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 bg-accent text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
      </div>
    </motion.div>
  );
}

interface RoleChipProps {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}

function RoleChip({ active, onClick, disabled, children }: RoleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        active
          ? 'bg-accent text-white'
          : 'bg-white text-slate-500 border border-slate-200 hover:border-accent hover:text-accent'
      }`}
    >
      {children}
    </button>
  );
}
