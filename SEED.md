# Gutplus Budget - Server

## Seed Data

בשביל להריץ בדיקות עם sample data:

```bash
npm run seed:run
```

### מה נוצר בSeed

**Users (2 משתמשים):**
- david.cohen@example.com (סטנדרטי)
- sarah.levy@example.com (פרימיום)

**Households (2 בתים):**
- משפחת כהן (4 אנשים)
- משפחת לוי (3 אנשים)

**Accounts (3 חשבונות):**
- חשבון בנק (balance: 15,000 ILS)
- כרטיס אשראי (balance: 2,500 ILS)
- חשבון חסכון (balance: 50,000 ILS)

**Categories:**
- הוצאות ביתיות (עם תתקטגוריות)
- הכנסות

**Transactions (4 עסקאות):**
- קנייה במכולת
- בדק מים וחשמל
- שכר חודשי
- תשלום כרטיס אשראי

**Budget Plans (3 תקציבים חודשיים)**

---

## להרים

```bash
# התקנת dependencies
npm install

# הרצה של migrations
npm run migration:run

# Seed data
npm run seed:run

# הרצת server
npm run dev
```
