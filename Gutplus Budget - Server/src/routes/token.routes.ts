import { Router } from 'express';
import { tokenController } from '../controllers';

const router = Router();

router.post('/reset-password', tokenController.resetPassword.bind(tokenController));

export default router;