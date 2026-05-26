import { Router } from 'express';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '@gutplus/shared';
import { transactionController } from '../controllers';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.post(
  '/',
  validate(createTransactionSchema),
  transactionController.create.bind(transactionController),
);
router.get('/', transactionController.findAll.bind(transactionController));
router.get('/:id', transactionController.findOne.bind(transactionController));
router.put(
  '/:id',
  validate(updateTransactionSchema),
  transactionController.update.bind(transactionController),
);
router.delete('/:id', transactionController.remove.bind(transactionController));

export default router;
