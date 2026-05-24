import { Router } from 'express';
import {
  checkEmailQuerySchema,
  forgotPasswordSchema,
  loginSchema,
  signUpSchema,
} from '@gutplus/shared';
import { userController } from '../controllers';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.get(
  '/check-email',
  validate(checkEmailQuerySchema, 'query'),
  userController.checkEmailExists.bind(userController),
);
router.post(
  '/sign-up',
  validate(signUpSchema),
  userController.signUp.bind(userController),
);
router.post(
  '/login',
  validate(loginSchema),
  userController.login.bind(userController),
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  userController.forgotPassword.bind(userController),
);
router.get('/me', authGuard, userController.me.bind(userController));
router.patch(
  '/complete-onboarding',
  authGuard,
  userController.completeOnboarding.bind(userController),
);
router.post('/logout', authGuard, userController.logout.bind(userController));

export default router;
