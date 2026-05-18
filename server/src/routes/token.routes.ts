import { Router } from 'express';
import { resetPasswordSchema } from '@gutplus/shared';
import { tokenController } from '../controllers';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  tokenController.resetPassword.bind(tokenController),
);

export default router;
