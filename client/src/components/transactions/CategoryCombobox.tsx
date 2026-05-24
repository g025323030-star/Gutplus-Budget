import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';
import type { Category } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

interface CategoryComboboxProps {
  value: string | null;
  categories: Category[];
  placeholder?: string;
  invalid?: boolean;
  ariaLabel?: string;
  onChange: (categoryId: string | null) => void;
  onBlurOutside?: () => void;
  onAddCategoryRequest?: () => void;
}

const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200';

const CategoryCombobox = forwardRef<HTMLDivElement, CategoryComboboxProps>(
  function CategoryCombobox(
    {
      value,
      categories,
      placeholder = 'הקלד לחיפוש קטגוריה…',
      invalid = false,
      ariaLabel = 'קטגוריה',
      onChange,
      onBlurOutside,
      onAddCategoryRequest,
    },
    ref,
  ) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);

    // מחזירים את שליפת הקטגוריה הספציפית שנבחרה כרגע (בשביל להציג את השם שלה כשהתפריט סגור)
    const selectedCategory = useMemo(
      () => categories.find((c) => c.id === value) ?? null,
      [categories, value],
    );

    const filteredOptions = useMemo(() => {
      const q = query.trim().toLowerCase();
      
      return categories
        // 1. סינון לפי שם הקטגוריה
        .filter((c) => (q === '' ? true : c.name.toLowerCase().includes(q)))
        // 2. מיון: סדר א'-ב' בעברית
        .sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }, [categories, query]); 

    useEffect(() => {
      if (!isOpen) return;
      const handler = (event: MouseEvent) => {
        if (!wrapperRef.current) return;
        if (!wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setQuery('');
          onBlurOutside?.();
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onBlurOutside]);

    useEffect(() => {
      setHighlightIndex(0);
    }, [query, isOpen]);

    const handleSelect = useCallback(
      (categoryId: string) => {
        onChange(categoryId);
        setIsOpen(false);
        setQuery('');
      },
      [onChange],
    );

    const handleAddNew = useCallback(() => {
      setIsOpen(false);
      setQuery('');
      onAddCategoryRequest?.();
    }, [onAddCategoryRequest]);

    const optionCount =
      filteredOptions.length + (onAddCategoryRequest ? 1 : 0);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setHighlightIndex((i) => Math.min(i + 1, Math.max(optionCount - 1, 0)));
        
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        
      } else if (event.key === 'Enter') {
        if (!isOpen) return;
        event.preventDefault();
        
        if (highlightIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightIndex].id); 
        } else if (onAddCategoryRequest) {
          handleAddNew();
        }
        
      } else if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setIsOpen(true);
      if (event.target.value === '') {
        onChange(null);
      }
    };

    const inputClass = invalid
      ? `${INPUT_CLASS} border-red-300 focus:border-red-400`
      : INPUT_CLASS;

    return (
      <div
        ref={(el) => {
          wrapperRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        className="relative"
      >
        <div className="relative">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={16}
            strokeWidth={ICON_STROKE}
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            aria-autocomplete="list"
            // תיקון ה-value: מציג את החיפוש או את שם הקטגוריה שנבחרה
            value={isOpen ? query : (selectedCategory?.name || '')}
            placeholder={placeholder}
            onFocus={() => setIsOpen(true)}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`${inputClass} pr-9`}
            dir="rtl"
          />
          <ChevronDown
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            size={16}
            strokeWidth={ICON_STROKE}
          />
        </div>

        {isOpen && (
          <ul
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {filteredOptions.length === 0 && (
              <li className="px-4 py-3 body-text-sm text-slate-400">
                לא נמצאה קטגוריה
              </li>
            )}
            {/* תיקון המיפוי: opt הוא כעת אובייקט הקטגוריה עצמו באופן ישיר */}
            {filteredOptions.map((opt, idx) => {
              const isActive = idx === highlightIndex;
              const isSelected = opt.id === value;
              return (
                <li
                  key={opt.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt.id);
                  }}
                  className={`px-4 py-2 cursor-pointer body-text-sm transition-colors duration-100 ${
                    isActive
                      ? 'bg-accent/10 text-primary'
                      : 'text-primary hover:bg-slate-50'
                  } ${isSelected ? 'font-semibold' : ''}`}
                >
                  {opt.name}
                </li>
              );
            })}
            {onAddCategoryRequest && (
              <li
                role="option"
                aria-selected={highlightIndex === filteredOptions.length}
                onMouseEnter={() =>
                  setHighlightIndex(filteredOptions.length)
                }
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddNew();
                }}
                className={`px-4 py-2 cursor-pointer label-text border-t border-slate-100 flex items-center gap-2 transition-colors duration-100 ${
                  highlightIndex === filteredOptions.length
                    ? 'bg-accent/10 text-accent'
                    : 'text-accent hover:bg-slate-50'
                }`}
              >
                <Plus size={16} strokeWidth={ICON_STROKE} />
                הוסף קטגוריה חדשה
              </li>
            )}
          </ul>
        )}
      </div>
    );
  },
);

export default CategoryCombobox;
