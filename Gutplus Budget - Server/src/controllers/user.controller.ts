import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { generateSignInToken } from '../utils/jwt.utils';


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
      user.password = password;
      await userService.update(user.id, { password });
      const cookieData = generateSignInToken(user.id);
      
      res.cookie(cookieData.name, cookieData.value, cookieData.options);

  res.status(200).send({ message: "Logged in successfully" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * פונקציית התחברות
   */

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