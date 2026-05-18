import { Router } from 'express';
import { transactionController } from '../controllers';

const router = Router();

router.post('/', transactionController.create.bind(transactionController));
router.get('/', transactionController.findAll.bind(transactionController));
router.get('/:id', transactionController.findOne.bind(transactionController));
router.put('/:id', transactionController.update.bind(transactionController));
router.delete('/:id', transactionController.remove.bind(transactionController));

export default router;