# GutPlus Budget

מערכת ניהול תקציב אישי/משפחתי.

## דרישות מקדימות

- [Docker](https://docs.docker.com/get-docker/) ו-[Docker Compose](https://docs.docker.com/compose/install/) מותקנים

## הקמת סביבת הפיתוח

### 1. הגדרת משתני סביבה

```bash
cp .env.example .env
```

ערוך את קובץ `.env` והגדר סיסמה חזקה ל-`POSTGRES_PASSWORD`.

### 2. הרמת PostgreSQL container

```bash
docker-compose up -d
```

### 3. בדיקת תקינות

בדוק שה-container פועל:

```bash
docker-compose ps
```

התחבר ל-DB מה-CLI (באמצעות הערכים שהוגדרו בקובץ `.env`):

```bash
docker-compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

### 4. עצירת הסביבה

```bash
docker-compose down
```

להסרת הנתונים לחלוטין (volume):

```bash
docker-compose down -v
```