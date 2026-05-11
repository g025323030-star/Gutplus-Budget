import { Request, Response, NextFunction } from 'express';
import { generateSignInToken,  cookieOptions} from '../utils/jwt.utils';

const jwt = require('jsonwebtoken');


export const rollingTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies[cookieOptions.name];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      
      // יצירת טוקן חדש עם זמן תפוגה רענן
      const newToken = generateSignInToken(decoded.id);
      
      // שליחת העוגייה המעודכנת מחדש
      res.cookie(cookieOptions.name, newToken, cookieOptions.options);
      
      // הזרקת פרטי המשתמש ל-req כדי שהקונטרולרים הבאים יוכלו להשתמש בזה
      (req as any).user = decoded; 
    } catch (error) {
      res.clearCookie(cookieOptions.name); // ניקוי העוגייה אם הטוקן לא תקין
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
  next();
};