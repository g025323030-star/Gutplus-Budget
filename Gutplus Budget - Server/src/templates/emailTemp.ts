export const resetPasswordEmailTemplate =`
    <!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #163351;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #163351;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
        }
        .header span {
            color: #358383;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
            text-align: center; /* מרכז את הטקסט למראה נקי יותר במיילים תפעוליים */
        }
        .greeting {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #163351;
        }
        .main-text {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .button {
            background-color: #358383;
            color: #ffffff !important; /* מבטיח שהטקסט יישאר לבן */
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 4px 6px rgba(53, 131, 131, 0.2);
        }
        .security-note {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #f1f5f9;
        }
        .footer {
            background-color: #f8fafc;
            padding: 25px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- לוגו המערכת -->
        <div class="header">
            <h1>גוטפלוס <span>פיננסנט</span></h1>
        </div>
        
        <div class="content">
            <div class="greeting">ביקשת לאפס את הסיסמה?</div>
            <p class="main-text">
                קיבלנו בקשה לאיפוס הסיסמה עבור החשבון שלך. 
                כדי לבחור סיסמה חדשה, פשוט לחץ על הכפתור למטה:
            </p>
            
            <!-- כפתור איפוס סיסמה בעיצוב טורקיז -->
            <div class="button-container">
                <a href="{{reset_link}}" class="button">לאיפוס סיסמה</a>
            </div>

            <p class="security-note">
                אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם מהמייל הזה בביטחון. הסיסמה שלך לא תשתנה עד שתלחץ על הקישור ותבצע את הפעולה.
            </p>
        </div>

        <div class="footer">
            <p>&copy; 2026 גוטפלוס פיננסנט - לדעת, לתכנן, לפעול, להרוויח.</p>
            <p>מייל זה נשלח באופן אוטומטי, נא לא להשיב לו.</p>
        </div>
    </div>

        <div class="footer">
            <p>&copy; 2026 גוטפלוס פיננסנט - לדעת, לתכנן, לפעול, להרוויח.</p>
            <p>מייל זה נשלח באופן אוטומטי, נא לא להשיב לו.</p>
        </div>
    </div>
</body>
</html>`;

export const formatResetPasswordEmailTemplate = (resetLink: string): string =>
  resetPasswordEmailTemplate.replace('{{reset_link}}', resetLink);
