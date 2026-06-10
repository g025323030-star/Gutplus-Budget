import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Sparkles, Settings2 } from 'lucide-react';
import type { DraftRow } from '../transactions/types';
import AdvancedModeModal from '../transactions/AdvancedModeModal';
import type { AdvancedModeResult } from '../transactions/AdvancedModeModal';

interface SuggestedRowsModalProps {
  isOpen: boolean;
  rows: DraftRow[];
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (rows: DraftRow[]) => Promise<void> | void;
}

export const SuggestedRowsModal: React.FC<SuggestedRowsModalProps> = ({
  isOpen,
  rows,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  const [localRows, setLocalRows] = useState<DraftRow[]>([]);
  
  // ניהול המצב של השורה שנמצאת כרגע בעריכה מתקדמת (לפי אינדקס)
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalRows(rows);
      setEditingRowIndex(null); // איפוס במקרה של פתיחה מחדש
    }
  }, [isOpen, rows]);

  // שליפת הנתונים של השורה שנמצאת בעריכה מתקדמת כרגע
  const activeEditingRow = useMemo(() => {
    if (editingRowIndex === null) return null;
    return localRows[editingRowIndex] || null;
  }, [editingRowIndex, localRows]);

  if (!isOpen) return null;

  // פונקציה גנרית לעדכון שדות
  const handleFieldChange = (index: number, field: keyof DraftRow, value: any) => {
    setLocalRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveRow = (index: number) => {
    setLocalRows((prev) => prev.filter((_, i) => i !== index));
    // אם השורה שנמחקה היא זו שנערכה, נסגור את תפריט העריכה
    if (editingRowIndex === index) setEditingRowIndex(null);
  };

  // טיפול באישור השינויים מה-AdvancedModeModal
  const handleAdvancedModeConfirm = (result: AdvancedModeResult) => {
    if (editingRowIndex === null) return;

    setLocalRows((prev) =>
      prev.map((row, i) => {
        if (i !== editingRowIndex) return row;

        if (result.mode === 'installments') {
          return {
            ...row,
            mode: 'installments',
            installmentsTotal: result.installmentsTotal,
            endDate: null,
            isBiMonthly: false,
          };
        }
        if (result.mode === 'recurring') {
          return {
            ...row,
            mode: 'recurring',
            installmentsTotal: null,
            endDate: result.endDate,
            isBiMonthly: result.isBiMonthly,
          };
        }
        return {
          ...row,
          mode: 'none',
          installmentsTotal: null,
          endDate: null,
          isBiMonthly: false,
        };
      })
    );

    setEditingRowIndex(null);
  };

  // פונקציית עזר להצגת טקסט אינדיקטיבי על כפתור ההגדרות המתקדמות
  const getAdvancedButtonLabel = (row: DraftRow) => {
    if (row.mode === 'installments' && row.installmentsTotal) {
      return `${row.installmentsTotal} תשלומים`;
    }
    if (row.mode === 'recurring') {
      return row.isBiMonthly ? 'דו-חודשי' : 'מחזורי';
    }
    return 'רגיל';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        
        {/* כותרת המודאל */}
        <header className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <Sparkles size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="heading-2">הוצאות מוצעות להוספה</h2>
              <p className="body-text-sm text-slate-400 mt-0.5">
                הזינו סכום עבור ההוצאות הרלוונטיות. שורות שיישארו ללא סכום לא יתווספו.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-primary p-2 hover:bg-slate-50 rounded-xl transition-all duration-300 disabled:opacity-50"
            aria-label="סגור חלון"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        {/* תוכן השורות */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-4 bg-background/30">
          
          {/* כותרת הטבלה לדסקטופ */}
          <div className="hidden md:grid grid-cols-[2fr_1.1fr_1.1fr_1fr_auto] gap-4 px-4 pb-2 border-b border-slate-100 label-text text-slate-400 font-bold">
            <div>תיאור ההוצאה</div>
            <div>סכום (₪)</div>
            <div>תאריך</div>
            <div className="text-center">סוג הגדרה</div> 
            <div className="w-10"></div>
          </div>

          <div className="space-y-3">
            {localRows.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-xl border border-slate-100">
                <p className="body-text text-slate-400">אין שורות מוצעות זמינות בקטגוריה זו</p>
              </div>
            ) : (
              localRows.map((row, index) => (
                <div
                  key={row.localId}
                  className="bg-surface rounded-xl border border-slate-100/80 p-4 md:p-3 md:grid md:grid-cols-[2fr_1.1fr_1.1fr_1fr_auto] md:gap-4 md:items-center shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3"
                >
                  {/* תיאור ההוצאה */}
                  <div className="font-bold text-primary body-text md:font-medium truncate md:px-1">
                    {row.description}
                  </div>

                  {/* שדה סכום */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`amount-${index}`} className="label-text text-xs md:hidden">סכום (₪)</label>
                    <input
                      id={`amount-${index}`}
                      name={`amount-${index}`}
                      type="number"
                      placeholder="הזינו סכום"
                      autoComplete="off"
                      disabled={isLoading}
                      value={row.amount || ''}
                      onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                      className="w-full bg-background border border-slate-200/80 rounded-xl px-4 py-2 label-text text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 disabled:opacity-60"
                    />
                  </div>

                  {/* שדה תאריך */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`date-${index}`} className="label-text text-xs md:hidden">תאריך</label>
                    <input
                      id={`date-${index}`}
                      name={`date-${index}`}
                      type="date"
                      disabled={isLoading}
                      value={row.date || ''}
                      onChange={(e) => handleFieldChange(index, 'date', e.target.value)}
                      className="w-full bg-background border border-slate-200/80 rounded-xl px-4 py-2 label-text text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 disabled:opacity-60"
                    />
                  </div>

                  {/* כפתור הגדרות מתקדמות (תשלומים/מחזורי) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="label-text text-xs md:hidden">הגדרות מתקדמות</label>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setEditingRowIndex(index)}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-300 ${
                        row.mode !== 'none'
                          ? 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10'
                          : 'border-slate-200/80 bg-background text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Settings2 size={15} strokeWidth={1.8} />
                      <span>{getAdvancedButtonLabel(row)}</span>
                    </button>
                  </div>

                  {/* כפתור מחיקת שורה בודדת */}
                  <div className="flex justify-end md:justify-center border-t border-slate-50 pt-2 md:pt-0 md:border-none">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleRemoveRow(index)}
                      className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all duration-300 flex items-center gap-1 md:gap-0 disabled:opacity-40"
                      title="הסר מרשימת ההצעות"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                      <span className="body-text-sm font-bold text-red-500 md:hidden">הסר הוצאה</span>
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </main>

        {/* פוטר המודאל (כפתורי פעולה) */}
        <footer className="p-6 md:p-8 border-t border-slate-100 flex flex-col-reverse md:flex-row gap-3 justify-end bg-surface">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl border border-slate-200 label-text text-slate-500 hover:bg-slate-50 transition-all duration-300 disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={() => onConfirm(localRows)}
            disabled={localRows.length === 0 || isLoading}
            className={`px-6 py-2.5 rounded-xl label-text text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              localRows.length === 0 || isLoading
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-accent hover:bg-accent/90 shadow-sm hover:shadow-md'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                שומר בשרת...
              </>
            ) : (
              'שמור והוסף לטבלה'
            )}
          </button>
        </footer>

      </div>

      {/* אינסטנס יחיד של המודאל המתקדם מחוץ ללופ - מונע בעיות ביצועים ועובד מול השורה האקטיבית */}
      <AdvancedModeModal
        isOpen={editingRowIndex !== null}
        initialMode={activeEditingRow?.mode ?? 'none'}
        initialInstallmentsTotal={activeEditingRow?.installmentsTotal ?? null}
        initialEndDate={activeEditingRow?.endDate ?? null}
        initialIsBiMonthly={activeEditingRow?.isBiMonthly ?? false}
        totalAmount={activeEditingRow?.amount ?? ''}
        onClose={() => setEditingRowIndex(null)}
        onConfirm={handleAdvancedModeConfirm}
      />
    </div>
  );
};