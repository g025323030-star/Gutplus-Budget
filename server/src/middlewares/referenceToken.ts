import { Request, Response, NextFunction } from 'express';
import { generateSignInToken, cookieOptions } from '../utils/jwt.utils';

const jwt = require('jsonwebtoken');


export const rollingTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[cookieOptions.name];

  // 1. אם אין טוקן - פשוט ממשיכים הלאה (או מחזירים 401 אם זה נתיב שחייב הזדהות)
  if (!token) {
    return next();
  }

  try {
    // 2. אימות הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    
    // 3. יצירת טוקן חדש (רענון)
    const newToken = generateSignInToken(decoded.id);
    
    // 4. עדכון העוגייה אצל הלקוח
    res.cookie(cookieOptions.name, newToken, cookieOptions.options);
    
    // 5. שמירת המידע להמשך הבקשה
    (req as any).user = decoded; 
    
    return next(); // חשוב להחזיר כאן כדי שלא ירוץ next() פעמיים
  } catch (error) {
    // 6. אם הטוקן פג תוקף או לא תקין - מנקים וממשיכים
    res.clearCookie(cookieOptions.name);
    // אופציונלי: אפשר להחזיר 401 כאן אם רוצים לחסום גישה
    return next(); 
  }
};