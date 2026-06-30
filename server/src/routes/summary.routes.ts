import { Router } from 'express';
import { summaryController } from '../controllers';

const router = Router();

router.get('/', summaryController.getSummary.bind(summaryController));

export default router;
