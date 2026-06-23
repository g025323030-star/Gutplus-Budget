# Full Development Specification: Annual Budget Overview & Forecast (Read-Only)

This document serves as the comprehensive blueprint for building an annual budget display screen based on **TypeScript** and **React** for the `Gutplus Budget` application. This component is designed for **read-only** presentation, excluding any input fields or edit buttons, and relies entirely on data passed as props from the parent component.

---

## 1. Data Architecture & Types (TypeScript Interfaces)

The following strict type definitions must be implemented to ensure consistency:

```typescript
export interface Month {
  id: number;     // 1-12
  name: string;   // e.g., "January (1)"
}

export interface BudgetItem {
  key: string;         // Unique key (e.g., 'fixed_income', 'charity')
  label: string;       // Display name (e.g., 'Tithes', 'Living Expenses')
  description: string; // Brief description
  values: number[];    // Hardcoded array of exactly 12 numbers (index 0-11)
}

export interface BudgetData {
  incomes: BudgetItem[];
  expenses: BudgetItem[];
}

export interface BudgetOverviewProps {
  budgetData: BudgetData;
}

export type ViewMode = 'dashboard' | 'sheet';

```

---

## 2. Component Structure & File Allocation

The code should be modularized into the following files under `src/pages/BudgetPlanner/`:

* `BudgetPlannerContainer.tsx`: The container component (manages `selectedMonth` and `viewMode` states).
* `components/MonthCarousel.tsx`: The month navigation bar.
* `components/SingleMonthView.tsx`: Focused month view (Income vs. Expense columns).
* `components/YearlySpreadsheetView.tsx`: Full annual spreadsheet view.

---

## 3. Visual & Functional Specification

All UI elements must follow a clean, professional **"High-Tech Chic"** aesthetic using Tailwind CSS, optimized for right-to-left (`dir="rtl"`) layouts.

### A. Header & View Switcher

* **Header:** `<h1>` titled "Annual Budget Overview" with a `Wallet` icon in deep teal (`#2D5A59`). Subtitle: "Annual cash flow summary (read-only)".
* **View Switcher:** A toggling container (`rounded-xl`, `bg-slate-200/60`) featuring two buttons:
* "Focused Month" (`dashboard`) with `LayoutDashboard` icon.
* "Full Annual View" (`sheet`) with `TableProperties` icon.


* **Active State:** White background with subtle shadow and deep teal text.

### B. Month Carousel (`MonthCarousel`)

* **Display:** Visible only in `dashboard` mode.
* **Navigation:** `ChevronRight` and `ChevronLeft` arrows for circular navigation (1-12 loop).
* **Tabs:** Horizontal scrollable list (`overflow-x-auto`) of all 12 months.
* **Active Tab:** High-contrast style (`bg-[#2D5A59]`, white text, deep shadow).

### C. KPI Cards

* **Placement:** Below the carousel (Dashboard) or above the table (Sheet).
* **Grid:** 3 responsive cards displaying Total Monthly Income, Total Monthly Expenses, and Monthly Net Balance (calculated based on `selectedMonth`).

### D. Focused Month View (`SingleMonthView`)

* **Layout:** Responsive 2-column grid (`grid-cols-1 lg:grid-cols-2`).
* **Column 1 (Income):** Green vertical accent, mapping `budgetData.incomes`. Amounts displayed in elevated white boxes, text in emerald green (`text-emerald-600`).
* **Column 2 (Expenses):** Red vertical accent, mapping `budgetData.expenses`. Amounts displayed in elevated white boxes, text in rose red (`text-rose-600`).

### E. Annual Spreadsheet View (`YearlySpreadsheetView`)

* **Table:** `overflow-x-auto` container with a `min-w-[1200px]` constraint.
* **Sticky Column:** The first column (Category Name) must remain fixed (`sticky right-0 bg-white z-10`) during horizontal scroll.
* **Row Structure:**
1. Income Category header + rows + total summary row.
2. Expense Category header + rows + total summary row.
3. **Footer:** "Final Monthly Balance" row with distinct styling (`bg-amber-100/60`), highlighting surplus (green) or deficit (red).



---

## 4. Logic & Calculation Functions

Components must implement the following pure utility functions:

1. **Calculate Category Total:**
`calculateTotal(type: 'incomes' | 'expenses', monthIndex: number): number`
2. **Calculate Balance:**
`getMonthlyBalance(monthIndex: number): number`
3. **Currency Formatting:**
All monetary values must be formatted as: `value.toLocaleString() + ' ₪'`.

---

**Implementation Guidelines:**

* **Styling:** Tailwind CSS.
* **Color Palette:** Emerald (Income), Rose (Expenses), Amber (Balance).
* **Language:** Hebrew (`dir="rtl"`).