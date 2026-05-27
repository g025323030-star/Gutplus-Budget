import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { generateSignInToken, cookieOptions } from '../utils/jwt.utils';
import { sendEmail } from '../utils/sendEmail';
import { comparePassword } from '../utils/password.utils';
import { resetPasswordEmailTemplate, formatResetPasswordEmailTemplate } from '../templates/emailTemp';
import { tokenController } from './token.controller';

interface EmailCheckResponse {
  message: string;
}

  interface User{
    id: string;
    email: string;
    password?: string | null;
  }

export class UserController {
 /**
       * 1. האם המיייל קיים בדאטאבייס=משתמש מורשה
       * 2. האם החשבון בתוקף
       * 3. האם קיימת סיסמא- אם כן, חשבון קיים וניתן להתחבר
       * 4. אם לא קיימת סיסמא- חשבון לא פעיל, יש להירשם
       */
async checkEmailExists(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
        const { email } = req.query as { email: string };
        console.log("Received email for check:", email);
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
    }
        const user = await userService.findByEmail(email);
        console.log("User found:", user);
        //בדיקה ראשונה-האם המשתמש מורשה במערכת
if(!user){
        res.status(403).json({
          success: false,
          message: 'unauthorized user.',
        });
        return;
      }
      //בדיקה שנייה- האם החשבון בתוקף
      if (user.expirationDate && user.expirationDate.getTime() < Date.now()) {
        res.status(403).json({
          success: false,
          message: 'Account expired. Please contact support.',
        });
        return;
      }
      //בדיקה שלישית-האם קיימת סיסמא- אם כן, חשבון קיים וניתן להתחבר
      if (user.password) {
        res.status(200).json({
          success: true,
          message: 'Welcome back! User found.',
          action: 'signin'
        });
        return;
      }else{
            res.status(200).json({
          message: 'Account is not active. Please sign up',
        });
        return;
          }
    } catch (error) {
      next(error);
    }
  }

  /**
   * פונקציה ליצירת הסיסמה במשתמש מאושר וחדש
   */
  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      let user: User | null= await userService.findByEmail(email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }
      await userService.update(user.id, { password });
      const token = generateSignInToken(user.id);
      res.cookie(cookieOptions.name, token, cookieOptions.options);
      res.status(200).send({ message: "Logged in successfully" });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      console.log("Login attempt for email:", email);
      console.log("Password provided:", password );
      const user = await userService.findByEmail(email);
      if (!user || !user.password) {
        console.log("User not found or password missing for email:", email);
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      console.log("[Login] Password from request:", password);
      console.log("[Login] Hashed password from DB:", user.password);
      console.log("[Login] DB password length:", user.password.length);
      const isMatch = await comparePassword(password, user.password);
      console.log("[Login] bcrypt.compare result:", isMatch);
      if (!isMatch) {
        console.log("Password mismatch for email:", email);
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      const token = generateSignInToken(user.id);
      res.cookie(cookieOptions.name, token, cookieOptions.options);
      res.status(200).json({ message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const user = await userService.findOne(userId);
      const householdId = user?.households?.[0]?.id ?? null;
      const onboardingCompleted = user?.onboardingCompleted ?? false;
      res.status(200).json({
        success: true,
        data: { id: userId, householdId, onboardingCompleted },
      });
    } catch (error) {
      next(error);
    }
  }

  async completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      console.log("Looking for user ID:", userId); // שורת בדיקה
      const user = await userService.findOne(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      const householdId = user.households?.[0]?.id;
      if (!householdId) {
        res.status(400).json({
          success: false,
          message: 'Cannot complete onboarding without a household',
        });
        return;
      }
      await userService.update(userId, { onboardingCompleted: true } as any);
      res.status(200).json({
        success: true,
        message: 'Onboarding completed',
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(cookieOptions.name);
    res.status(200).json({ message: 'Logged out successfully' });
  }

  /**
   * פונקציה לשליחת מייל עבור איפוס סיסמא
   */

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await userService.findByEmail(email);
      console.log('User found for forgot password:', user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const token = await tokenController.createResetToken(user.id);
      const resetLink = `${process.env.FRONTEND_URL }/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      const html = formatResetPasswordEmailTemplate(resetLink);

      await sendEmail({
        to: email,
        subject: 'איפוס סיסמה',
        html,
      });

      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createUserDto: CreateUserDto = req.body;
      const user = await userService.create(createUserDto);
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.findAll();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.findOne(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateUserDto: UpdateUserDto = req.body;
      const user = await userService.update(id, updateUserDto);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await userService.remove(id);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();