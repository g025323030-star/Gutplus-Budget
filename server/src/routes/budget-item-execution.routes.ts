import { Router } from 'express';
import {
  getBudgetLineItemsQuerySchema,
  upsertBudgetItemExecutionSchema,
} from '@gutplus/shared';
import { budgetItemExecutionController } from '../controllers';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.put(
  '/',
  validate(upsertBudgetItemExecutionSchema),
  budgetItemExecutionController.upsert.bind(budgetItemExecutionController),
);
router.get(
  '/line-items',
  validate(getBudgetLineItemsQuerySchema, 'query'),
  budgetItemExecutionController.getLineItems.bind(budgetItemExecutionController),
);

export default router;
