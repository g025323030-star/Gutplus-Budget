import { Router } from 'express';
import {
  createBudgetItemSchema,
  updateBudgetItemSchema,
} from '@gutplus/shared';
import { budgetItemController } from '../controllers';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.post(
  '/',
  validate(createBudgetItemSchema),
  budgetItemController.create.bind(budgetItemController),
);
router.get('/', budgetItemController.findAll.bind(budgetItemController));
router.get('/:id', budgetItemController.findOne.bind(budgetItemController));
router.put(
  '/:id',
  validate(updateBudgetItemSchema),
  budgetItemController.update.bind(budgetItemController),
);
router.delete('/:id', budgetItemController.remove.bind(budgetItemController));

export default router;
