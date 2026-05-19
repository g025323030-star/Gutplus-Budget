  const jwt = require('jsonwebtoken');




  interface Cookie {
 name: string;
 options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      maxAge: number;
 }
  }

    // export class ValidateToken{
  /**
       * פונקציה ליצירת טוקן התחברות עם תוקף של שעה
       */
       export const generateSignInToken=(id: string) =>{
        const token = jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return token
       }
// הגדרת העוגייה
export const cookieOptions:Cookie={
    name: 'token',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000
    }
}
      
    // }