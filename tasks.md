# מסמך הגדרת משימות — GutPlus Budget

**פרויקט:** מערכת ניהול תקציב אישי/משפחתי  
**תאריך התחלה:** 18.3.2026  
**תאריך סיום Phase 1:** ~17.6.2026  
**סה"כ:** ~48 ימי עבודה (3 חודשים)  
**מקור:** מסמך אפיון טכני + סיכום פגישה 26.2.2026 + סיכום שיחה חוזרת

---

## Milestones

| Milestone | תאריכים | תיאור |
|-----------|---------|-------|
| **M1** | 18.3 – 31.3 | תשתית — Database, Design System, Frontend בסיסי |
| **M2** | 1.4 – 29.4 | ליבת המערכת — Backend, API, חיבור, Login System |
| **M3** | 30.4 – 20.5 | Admin + מחקר ותהליך טעינת אקסל בנקאי |
| **M4** | 21.5 – 17.6 | Dashboard מתקדם |
| **Backlog** | — | משימות ל-Phase 2+ |

---

## Labels ל-GitHub

```
feature, infra, research, security, testing, admin, ai, ux,
excel, dashboard, auth, backend, frontend, integration, devops,
database, phase2, phase3
```

---

## M1 — תשתית (18.3 – 31.3) · 7 ימים

### TASK-01: הגדרת Database (4 ימים)

**Labels:** `infra`, `database`  
**Priority:** P0 — Critical  
**תלויות:** אין  
**FR/NFR קשורים:** סעיף 4 באפיון (Database Schema), NFR-001  
**תאריך יעד:** 24.3.2026

#### Sub-Issues:

**TASK-01a: הקמת Docker + PostgreSQL Container**
- התקנת Docker, יצירת `docker-compose.yml`
- הגדרת PostgreSQL container עם volume לשמירת נתונים
- הגדרת environment variables (DB credentials)
- **אומדן:** יום
- **DoD:** `docker-compose up` מרים PostgreSQL container תקין, אפשר להתחבר מ-CLI

**TASK-01b: הגדרת סכמת טבלאות**
- יצירת כל הטבלאות לפי סעיף 4 באפיון:
  - `Users` — משתמשים (user_id, email, name, auth_method, subscription_type, created_at)
  - `Snapshot` — תמונת מצב (num_people, work_hours, total_assets, total_liabilities, target_budget)
  - `Budget` — תקציב חודשי/שנתי (budget_type, period_start/end, income_fixed, expenses_fixed/variable, savings_target)
  - `BudgetCategories` — קטגוריות (category_name, category_type, amount, is_fixed, is_afsan)
  - `Transactions` — עסקאות (date_transaction, date_charged, amount, source, description, is_verified)
  - `Assets` — נכסים (asset_type, asset_name, value, purchase_date/price)
  - `Liabilities` — התחייבויות (liability_type, amount, interest_rate, monthly_payment, start/end_date)
  - `Maaserot` — מעשרות (income_amount, expenses_deductible, maaser_required/given, balance)
  - `InternalSavings` — קופה פנימית (goal_name, target/current_amount, monthly_deposit, deadline)
  - `Alerts` — התראות (alert_type, message, threshold, is_active)
- הגדרת Primary Keys (UUID), Foreign Keys, Indexes
- **אומדן:** יומיים
- **DoD:** כל הטבלאות קיימות ב-DB, קשרים (FK) תקינים, אפשר לבצע INSERT/SELECT

**TASK-01c: Seed Data + סקריפטי מיגרציה**
- יצירת Migration scripts (Alembic/Knex/Prisma — לפי בחירת Backend)
- יצירת Seed script עם נתוני דוגמה: משתמש לדוגמה, תקציב חודשי, 20+ עסקאות, קטגוריות GutPlus
- **אומדן:** יום
- **DoD:** `migrate` + `seed` רצים בהצלחה, DB מלא בנתוני דוגמה

---

### TASK-02: Design System + Frontend בסיסי (3 ימים)

**Labels:** `frontend`, `ux`  
**Priority:** P0 — Critical  
**תלויות:** אין  
**FR/NFR קשורים:** NFR-030 (RTL), NFR-031, NFR-032, נספח B באפיון  
**תאריך יעד:** 27.3.2026

#### Sub-Issues:

**TASK-02a: יצירת Design System**
- פלטת צבעים GutPlus: ירוק (בתוך תקציב), אדום (חריגה)
- טיפוגרפיה: Heebo / Rubik
- קומפוננטות: כפתורים (גדלים, states), טפסים, ניווט, הודעות/מודלים, תגיות, אייקונים
- תמיכה מלאה ב-RTL
- כלי עבודה: Canvas (ChatGPT) ליצירת ה-DS
- **אומדן:** 2 שעות
- **DoD:** קובץ Design System מוכן עם כל ה-tokens, קומפוננטות בסיס מיושמות ב-React

**TASK-02b: עמודי Frontend בסיסיים (React)**
- עמוד מילוי תקציב חודשי
- עמוד מילוי תקציב שנתי
- עמוד הצגת נתונים בסיסי
- ניווט בין העמודים (React Router)
- RTL תקין בכל העמודים
- **אומדן:** יום
- **DoD:** ניווט בין 3+ עמודים עובד, RTL תקין, Design System מיושם

**TASK-02c: הגדרת Mock Data מ-JSON**
- יצירת JSON fixtures: עסקאות (20+), קטגוריות GutPlus, תקציב חודשי/שנתי, משתמש לדוגמה
- חיבור ה-Mock Data לעמודי Frontend
- הצגת נתונים בטבלאות/רשימות
- **אומדן:** יום
- **DoD:** כל עמודי Frontend מציגים נתוני Mock, אפשר לראות תקציב + עסקאות

---

## M2 — ליבת המערכת (1.4 – 29.4) · 18 ימים

### TASK-03: Backend + API (5 ימים)

**Labels:** `backend`, `api`, `infra`  
**Priority:** P0 — Critical  
**תלויות:** TASK-01 (Database מוכן)  
**FR/NFR קשורים:** FR-001 עד FR-005, FR-010 עד FR-014  
**תאריך יעד:** 8.4.2026

#### Sub-Issues:

**TASK-03a: הקמת Backend + מבנה פרויקט**
- בחירת Framework: Node.js (Express/Fastify) או Python (FastAPI)
- מבנה תיקיות: routes, controllers, models, middleware, utils
- הגדרת Docker container ל-Backend
- חיבור ל-PostgreSQL (ORM — Prisma/SQLAlchemy/TypeORM)
- Health-check endpoint (`GET /api/health`)
- **אומדן:** יום
- **DoD:** `docker-compose up` מרים Backend + DB, health-check מחזיר 200

**TASK-03b: API Endpoints — CRUD הכנסות/הוצאות/קטגוריות**
- `POST/GET/PUT/DELETE /api/transactions` — עסקאות
- `POST/GET/PUT/DELETE /api/categories` — קטגוריות
- Validation, Error handling, Pagination
- **אומדן:** יומיים
- **DoD:** כל ה-CRUD endpoints עובדים, ניתן לבדוק עם Postman/curl

**TASK-03c: API Endpoints — Budget + Snapshot**
- `POST/GET/PUT /api/budgets` — תקציב חודשי/שנתי
- `POST/GET /api/snapshots` — תמונת מצב
- `GET /api/budgets/:id/summary` — סיכום תקציב (תכנון מול ביצוע)
- **אומדן:** יום
- **DoD:** אפשר ליצור תקציב, להוסיף עסקאות, ולקבל סיכום מחושב

**TASK-03d: חיבור ORM + Migrations**
- הגדרת Models ב-ORM לפי סכמת ה-DB
- הגדרת Relations (User → Budgets → Categories → Transactions)
- Migration scripts אוטומטיים
- **אומדן:** יום
- **DoD:** ORM Models תואמים את ה-DB Schema, migrations רצות בהצלחה

---

### TASK-04: חיבור Frontend ↔ Backend (5 ימים)

**Labels:** `frontend`, `backend`, `integration`  
**Priority:** P0 — Critical  
**תלויות:** TASK-02 (Frontend), TASK-03 (Backend)  
**FR/NFR קשורים:** NFR-001 (טעינה < 2 שניות)  
**תאריך יעד:** 15.4.2026

#### Sub-Issues:

**TASK-04a: שכבת API Client ב-Frontend**
- הגדרת HTTP Client (Axios/Fetch) עם Base URL
- Interceptors: Authorization header, Error handling
- TypeScript interfaces לכל ה-API responses
- **אומדן:** יום
- **DoD:** API Client מוגדר, TypeScript types מוכנים, error handling עובד

**TASK-04b: חיבור עמוד תקציב חודשי**
- שליפת תקציב חודשי מ-API (GET)
- טופס יצירת/עדכון תקציב (POST/PUT)
- הצגת קטגוריות + סכומים
- Loading states + Error states
- **אומדן:** יומיים
- **DoD:** תקציב חודשי נטען מה-DB, אפשר ליצור/לערוך, שינויים נשמרים

**TASK-04c: חיבור עמוד תקציב שנתי + הצגת נתונים**
- שליפת תקציב שנתי מ-API
- טופס יצירת/עדכון תקציב שנתי
- עמוד הצגת עסקאות + סינון/חיפוש
- **אומדן:** יומיים
- **DoD:** תקציב שנתי ועסקאות נטענים מה-DB, סינון עובד, UI responsive

---

### TASK-05: Login System (8 ימים)

**Labels:** `security`, `auth`, `feature`  
**Priority:** P0 — Critical  
**תלויות:** TASK-03 (Backend API מוכן)  
**FR/NFR קשורים:** NFR-010 (הצפנה), NFR-011 (HTTPS), NFR-012 (OAuth2)  
**תאריך יעד:** 29.4.2026

#### Sub-Issues:

**TASK-05a: UI — עמודי Sign Up + Sign In**
- עמוד הרשמה: שם, email, סיסמה (+ validation)
- עמוד כניסה: email + סיסמה
- כפתור "Login with Google"
- עיצוב לפי Design System, RTL
- **אומדן:** יומיים
- **DoD:** עמודי Login/Register מעוצבים ותקינים, validation בצד client

**TASK-05b: Backend — הרשמה והתחברות ידניים**
- `POST /api/auth/register` — יצירת משתמש (bcrypt לסיסמה)
- `POST /api/auth/login` — אימות + JWT token generation
- `POST /api/auth/logout` — ביטול token
- Password validation rules (אורך מינימלי, מורכבות)
- **אומדן:** יומיים
- **DoD:** אפשר להירשם, להתחבר, לקבל JWT, ולעשות logout

**TASK-05c: Google OAuth2 Integration**
- רישום ב-Google Cloud Console
- הגדרת OAuth2 credentials + redirect URIs
- Backend endpoint: `GET /api/auth/google` + callback
- יצירת/קישור משתמש מ-Google profile
- **הערה:** Google OAuth עלול לדרוש אימות דו-שלבי — לכן חשובה גם כניסה ידנית
- **אומדן:** יומיים
- **DoD:** אפשר ללחוץ "Login with Google", לקבל token, ולהיכנס למערכת

**TASK-05d: Middleware — הגנת Routes + Session Management**
- Auth middleware: בדיקת JWT בכל request מוגן
- Redirect למשתמש לא מחובר → עמוד Login
- Token refresh / expiry handling
- שמירת session ב-Frontend (localStorage/cookie)
- Protected routes ב-React Router
- **אומדן:** יומיים
- **DoD:** עמודים מוגנים לא נגישים ללא login, token expiry מטופל, logout מנקה session

---

## M3 — Admin + אקסלים (30.4 – 20.5) · 15 ימים

### TASK-06: מערכת Admin בסיסית (5 ימים)

**Labels:** `admin`, `feature`  
**Priority:** P1 — High  
**תלויות:** TASK-05 (Login System)  
**FR/NFR קשורים:** —  
**תאריך יעד:** 6.5.2026

#### Sub-Issues:

**TASK-06a: UI — עמוד Admin מוגן**
- עמוד Admin נפרד עם כניסה בשם משתמש + סיסמה קבועים (hardcoded/env)
- מנהל מערכת אחד בלבד בשלב זה
- Layout: sidebar עם ניווט Admin
- **אומדן:** יום
- **DoD:** עמוד Admin נגיש רק עם credentials נכונים, UI מעוצב

**TASK-06b: ניהול Whitelist — לקוחות מורשים**
- טבלת לקוחות מורשים (email, שם, תאריך הוספה, סטטוס)
- הוספת לקוח חדש ל-whitelist
- הסרת/השהיית לקוח
- רק משתמשים ב-whitelist יכולים להירשם למערכת
- **אומדן:** יומיים
- **DoD:** Admin יכול להוסיף/להסיר לקוחות, הרשמה חסומה למי שלא ב-whitelist

**TASK-06c: סיכומים ודוחות על לקוחות**
- רשימת כל הלקוחות הרשומים
- סטטוס: פעיל/לא פעיל, תאריך כניסה אחרון
- סיכום: כמה תקציבים יצרו, כמה עסקאות הזינו
- **אומדן:** יומיים
- **DoD:** Admin רואה טבלת לקוחות עם סטטיסטיקות בסיסיות

---

### TASK-07: מחקר זיהוי אקסלים בנקאיים (5 ימים)

**Labels:** `research`, `excel`  
**Priority:** P1 — High  
**תלויות:** אין  
**FR/NFR קשורים:** FR-010, FR-011  
**תאריך יעד:** 13.5.2026  
**הערה:** ניתן להעביר חלק מהמחקר למישהו אחר כדי לחסוך זמן

#### Sub-Issues:

**TASK-07a: מיפוי פורמטים — בנקים**
- בנק הפועלים — מבנה Excel, עמודות, כותרות, פורמט תאריכים
- בנק לאומי — מבנה Excel
- בנק דיסקונט — מבנה Excel
- בנק מזרחי טפחות — מבנה Excel
- תיעוד ההבדלים בין הפורמטים
- **אומדן:** יומיים
- **DoD:** מסמך מיפוי מפורט לכל בנק עם דוגמאות

**TASK-07b: מיפוי פורמטים — חברות אשראי**
- ויזה כאל — מבנה Excel
- ישראכרט — מבנה Excel
- מקס — מבנה Excel
- תיעוד ההבדלים בין הפורמטים
- **אומדן:** יומיים
- **DoD:** מסמך מיפוי מפורט לכל חברת אשראי עם דוגמאות

**TASK-07c: יצירת Pattern Templates**
- Template config לכל פורמט (JSON/YAML): שם עמודות, מיקום כותרות, פורמט תאריך, פורמט סכום
- מנגנון זיהוי אוטומטי — באיזה בנק/חברת אשראי מדובר (Pattern Matching)
- **אומדן:** יום
- **DoD:** Template לכל בנק/אשראי, אלגוריתם זיהוי מזהה נכון ב-80%+ מהמקרים

---

### TASK-08: תהליך טעינת אקסל בנקאי (5 ימים)

**Labels:** `feature`, `excel`  
**Priority:** P1 — High  
**תלויות:** TASK-07 (מחקר), TASK-04 (חיבור Frontend ↔ Backend)  
**FR/NFR קשורים:** FR-010, FR-011, FR-012, FR-013, FR-014, NFR-002 (עיבוד < 5 שניות)  
**תאריך יעד:** 20.5.2026

#### Sub-Issues:

**TASK-08a: Parser — שליפת מידע מאקסל**
- Upload endpoint: `POST /api/excel/upload`
- זיהוי אוטומטי של פורמט (בנק/אשראי) לפי Pattern Templates
- שליפת עמודות: תאריך עסקה, תאריך חיוב, סכום, תיאור
- טכנולוגיה: SheetJS (xlsx) / Pandas
- **אומדן:** יום וחצי
- **DoD:** אקסל מועלה, מזוהה, ונתונים נשלפים נכון ל-3+ בנקים

**TASK-08b: UI — הצגת נתונים ללקוח לאישור/תיקון**
- טבלה עם עסקאות שנשלפו מהאקסל
- אפשרות לתקן/מחוק שורות לפני שמירה
- סימון שורות בעייתיות (סכום חסר, תאריך לא תקין)
- **אומדן:** יום
- **DoD:** לקוח רואה טבלת עסקאות, יכול לתקן, ולאשר

**TASK-08c: קטגוריזציה — רשימה סגורה של GutPlus**
- הצגת רשימת קטגוריות GutPlus (מזון, דיור, ביגוד, חשמל, גז, ביטוחים, פלאפון וכו')
- שיוך כל עסקה לקטגוריה (dropdown / autocomplete)
- שמירת העדפות: אם "רמי לוי" = "מזון", לזכור לפעם הבאה
- **אומדן:** יום וחצי
- **DoD:** כל עסקה משויכת לקטגוריה GutPlus, העדפות נשמרות

**TASK-08d: קטגוריה אישית ללקוח**
- אפשרות ללקוח להוסיף קטגוריה ייחודית (לא מרשימת GutPlus)
- קטגוריה אישית נשמרת רק אצל הלקוח הספציפי
- הצגה ב-dropdown יחד עם קטגוריות GutPlus
- **אומדן:** חצי יום
- **DoD:** לקוח יכול להוסיף קטגוריה אישית, היא מופיעה רק אצלו

---

## M4 — Dashboard (21.5 – 17.6) · 8 ימים

### TASK-09: Dashboard מתקדם (8 ימים)

**Labels:** `feature`, `ux`, `dashboard`  
**Priority:** P1 — High  
**תלויות:** TASK-04 (חיבור Frontend ↔ Backend), TASK-08 (טעינת אקסל)  
**FR/NFR קשורים:** FR-020 עד FR-024, NFR-001 (טעינה < 2 שניות)  
**תאריך יעד:** 17.6.2026

#### Sub-Issues:

**TASK-09a: תצוגת תכנון מול ביצוע**
- גרף בר: תקציב מתוכנן vs הוצאות בפועל לכל קטגוריה
- צבעים: ירוק (בתוך תקציב), אדום (חריגה)
- סיכום כללי: סה"כ הכנסות, סה"כ הוצאות, יתרה
- טכנולוגיה: Chart.js / D3.js
- **אומדן:** 3 ימים
- **DoD:** דשבורד מציג תכנון מול ביצוע בגרפים, צבעים נכונים, נתונים מה-DB

**TASK-09b: סיכומים חודשיים/שנתיים + פילוח קטגוריות**
- תצוגת סיכום חודשי: הכנסות, הוצאות קבועות, הוצאות משתנות, חיסכון
- תצוגת סיכום שנתי: טבלה 12 חודשים
- Pie chart: פילוח הוצאות לפי קטגוריות
- **אומדן:** 3 ימים
- **DoD:** סיכומים חודשי + שנתי מוצגים, pie chart פילוח קטגוריות

**TASK-09c: השוואות בין תקופות + גרפים ויזואליים**
- בחירת 2 חודשים/תקווואה
- גרף Line: מגמת הוצאות לאורך זמן
- גרף Stacked Bar: הוצאות לפי קטגוריה לאורך חודשים
- **אומדן:** 2 ימים
- **DoD:** אפשר להשוות תקופות, גרפי מגמות מוצגים נכון

---

## Backlog — Phase 2+

### TASK-10: העלאת אקסל GutPlus — משימת AI (Phase 2)

**Labels:** `feature`, `ai`, `phase2`  
**Priority:** P2 — Medium  
**אומדן:** 2 ימים  
**תיאור:** זיהוי מבנה אקסל GutPlus, parsing עם SheetJS/Pandas, מיפוי אוטומטי של קטגוריות, AI לזיהוי חריגות ואנומליות בנתונים.  
**DoD:** משתמש מעלה אקסל GutPlus, המערכת מזהה ומייבאת אוטומטית

---

### TASK-11: מעקב חודשי — טבלת עדכונים (Phase 2)

**Labels:** `feature`, `phase2`  
**Priority:** P2 — Medium  
**אומדן:** 5 ימים  
**תיאור:** מסך להכנסת עדכונים חודשיים כמו טבלת מעקב — הזנת הוצאות/הכנסות בפועל מול התקציב המתוכנן, עם סימון סטטוס וחריגות.  
**DoD:** משתמש יכול להזין עדכונים חודשיים ולראות סטטוס תכנון מול ביצוע

---

### TASK-12: העלאה לענן + סביבת בדיקות (Phase 2)

**Labels:** `infra`, `devops`, `phase2`  
**Priority:** P2 — Medium  
**אומדן:** 5 ימים  
**תיאור:** בחירת פלטפורמת ענן (AWS/Google Cloud/Azure), הגדרת סביבת Staging, CI/CD pipeline (GitHub Actions), deployment אוטומטי.  
**DoD:** המערכת רצה בענן, יש סביבת staging, deployment אוטומטי עובד

---

### TASK-13: בדיקות אוטומטיות (Phase 2)

**Labels:** `testing`, `phase2`  
**Priority:** P2 — Medium  
**אומדן:** 5 ימים  
**תיאור:** כתיבת Unit Tests ל-Backend (API endpoints), Integration Tests (DB + API), Frontend Tests (Component tests), E2E Tests (Cypress/Playwright).  
**DoD:** כיסוי בדיקות 70%+, CI רץ בדיקות אוטומטית לפני merge

---

### TASK-14: בחינת API בנקאי (Phase 3)

**Labels:** `research`, `phase3`  
**Priority:** P3 — Low  
**אומדן:** TBD  
**תיאור:** בחינת אפשרויות Open Banking API עם בנקים ישראליים וחברות אשראי. בדיקת דרישות אבטחה, רגולציה, עלויות, וזמינות.  
**פעולה פתוחה מפגישה:** אחראי — ישראל גוטמן

---

### TASK-15: תכנון מערכת התראות (Phase 2)

**Labels:** `feature`, `phase2`  
**Priority:** P2 — Medium  
**אומדן:** TBD  
**תיאור:** תכנון מנגנון התראות: חריגה מתקציב (FR-050), תשלום צפוי גדול (FR-051), תזכורות חידוש ביטוחים (FR-052), התראות מותאמות אישית (FR-053). כולל בחירת ערוצי התראה (email, push, SMS).  
**פעולה פתוחה מפגישה:** אחראי — Aviv Mali

---

### TASK-16: בחירת פלטפורמת ענן סופית (Phase 2)

**Labels:** `infra`, `phase2`  
**Priority:** P2 — Medium  
**אומדן:** TBD  
**תיאור:** השוואה בין AWS, Google Cloud, Azure. קריטריונים: עלות, קלות שימוש, תמיכה ב-PostgreSQL, Free Tier, אבטחה.  
**פעולה פתוחה מפגישה:** אחראי — צוות

---

## סיכום משימות

| Milestone | משימות | ימים | תאריכים |
|-----------|--------|------|---------|
| M1 — תשתית | TASK-01, TASK-02 | 7 | 18.3 – 31.3 |
| M2 — ליבה | TASK-03, TASK-04, TASK-05 | 18 | 1.4 – 29.4 |
| M3 — Admin + אקסלים | TASK-06, TASK-07, TASK-08 | 15 | 30.4 – 20.5 |
| M4 — Dashboard | TASK-09 | 8 | 21.5 – 17.6 |
| **סה"כ Phase 1** | **9 משימות, 22 Sub-Issues** | **48** | **3 חודשים** |
| Backlog | TASK-10 עד TASK-16 | TBD | Phase 2+ |
